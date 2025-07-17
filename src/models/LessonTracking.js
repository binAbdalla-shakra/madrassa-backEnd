const mongoose = require('mongoose');

const lessonTrackingSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  surahId: {
    type: mongoose.Schema.Types.ObjectId,
    // ref: 'Surah',
    required: true
  },
  from_ayah: {
    type: Number,
    required: true,
    min: 1
  },
  to_ayah: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['Completed', 'Pending', 'In Progress', 'Skipped'],
    default: 'Pending'
  },
  remarks: {
    type: String
  },

  // Audit Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: true
  },
  modifiedAt: {
    type: Date
  },
  modifiedBy: {
    type: String
  }
});

module.exports = mongoose.model('LessonTracking', lessonTrackingSchema);
