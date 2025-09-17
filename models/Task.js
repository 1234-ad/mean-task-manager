const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  dueDate: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  subtasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ createdAt: -1 });

// Virtual for completion percentage
TaskSchema.virtual('completionPercentage').get(function() {
  if (this.subtasks.length === 0) {
    return this.status === 'completed' ? 100 : 0;
  }
  const completed = this.subtasks.filter(subtask => subtask.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

// Ensure virtual fields are serialized
TaskSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Task', TaskSchema);