const express = require('express');
const { query } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users for assignment (accessible to all authenticated users)
router.get('/search', auth, [
  query('q').trim().isLength({ min: 1 }).withMessage('Search query is required')
], async (req, res) => {
  try {
    const searchQuery = req.query.q;
    
    const users = await User.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email avatar role')
    .limit(10);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's task statistics
    const taskStats = await Task.aggregate([
      {
        $match: {
          assignedTo: user._id,
          isArchived: false
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', 'completed'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = taskStats[0] || {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0
    };

    // Get recent tasks
    const recentTasks = await Task.find({
      assignedTo: user._id,
      isArchived: false
    })
    .populate('project', 'name color')
    .sort({ updatedAt: -1 })
    .limit(5);

    res.json({
      user,
      statistics: stats,
      recentTasks
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const allowedUpdates = ['name', 'email', 'role', 'isActive'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user dashboard data
router.get('/:id/dashboard', auth, async (req, res) => {
  try {
    // Users can only access their own dashboard unless they're admin
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.params.id;

    // Get tasks assigned to user
    const myTasks = await Task.find({
      assignedTo: userId,
      isArchived: false
    })
    .populate('project', 'name color')
    .populate('createdBy', 'name')
    .sort({ dueDate: 1, priority: -1 })
    .limit(10);

    // Get tasks created by user
    const createdTasks = await Task.find({
      createdBy: userId,
      isArchived: false
    })
    .populate('assignedTo', 'name avatar')
    .populate('project', 'name color')
    .sort({ createdAt: -1 })
    .limit(5);

    // Get upcoming deadlines
    const upcomingDeadlines = await Task.find({
      assignedTo: userId,
      dueDate: { 
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      },
      status: { $ne: 'completed' },
      isArchived: false
    })
    .populate('project', 'name color')
    .sort({ dueDate: 1 })
    .limit(5);

    // Get task statistics by status
    const statusStats = await Task.aggregate([
      {
        $match: {
          assignedTo: new mongoose.Types.ObjectId(userId),
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get task statistics by priority
    const priorityStats = await Task.aggregate([
      {
        $match: {
          assignedTo: new mongoose.Types.ObjectId(userId),
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate productivity metrics
    const completedThisWeek = await Task.countDocuments({
      assignedTo: userId,
      status: 'completed',
      updatedAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    });

    const completedThisMonth = await Task.countDocuments({
      assignedTo: userId,
      status: 'completed',
      updatedAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      myTasks,
      createdTasks,
      upcomingDeadlines,
      statistics: {
        statusDistribution: statusStats,
        priorityDistribution: priorityStats,
        productivity: {
          completedThisWeek,
          completedThisMonth
        }
      }
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;