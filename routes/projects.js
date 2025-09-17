const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const filter = { isArchived: false };
    
    // If not admin, only show projects where user is owner or member
    if (req.user.role !== 'admin') {
      filter.$or = [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ];
    }

    const projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    // Add task counts and progress for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ 
          project: project._id, 
          isArchived: false 
        });
        const completedTasks = await Task.countDocuments({ 
          project: project._id, 
          status: 'completed',
          isArchived: false 
        });
        
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
          ...project.toObject(),
          taskStats: {
            total: totalTasks,
            completed: completedTasks,
            progress
          }
        };
      })
    );

    res.json(projectsWithStats);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access
    const hasAccess = project.owner._id.equals(req.user._id) ||
                     project.members.some(member => member.user._id.equals(req.user._id)) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get project tasks
    const tasks = await Task.find({ 
      project: project._id, 
      isArchived: false 
    })
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    // Calculate project statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const overdueTasks = tasks.filter(task => 
      task.dueDate && task.dueDate < new Date() && task.status !== 'completed'
    ).length;

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      ...project.toObject(),
      tasks,
      statistics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        progress
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create project
router.post('/', auth, [
  body('name').trim().isLength({ min: 1 }).withMessage('Project name is required'),
  body('description').optional().trim(),
  body('endDate').optional().isISO8601(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectData = {
      ...req.body,
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: 'owner'
      }]
    };

    const project = new Project(projectData);
    await project.save();

    await project.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' }
    ]);

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled']),
  body('endDate').optional().isISO8601(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or admin
    if (!project.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowedUpdates = [
      'name', 'description', 'status', 'endDate', 'color', 'budget'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' }
    ]);

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add member to project
router.post('/:id/members', auth, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').optional().isIn(['admin', 'member', 'viewer']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or admin
    if (!project.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { userId, role = 'member' } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = project.members.find(member => 
      member.user.equals(userId)
    );
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push({
      user: userId,
      role
    });

    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({
      message: 'Member added successfully',
      project
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member from project
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or admin
    if (!project.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Cannot remove the owner
    if (project.owner.equals(req.params.userId)) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    project.members = project.members.filter(member => 
      !member.user.equals(req.params.userId)
    );

    await project.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or admin
    if (!project.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Archive all tasks in this project
    await Task.updateMany(
      { project: req.params.id },
      { isArchived: true }
    );

    // Archive the project
    project.isArchived = true;
    await project.save();

    res.json({ message: 'Project archived successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;