const mongoose = require('mongoose');

const studentGroupHistorySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  joinDate: { type: Date, default: Date.now },
  leaveDate: { type: Date },
  transferredTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
});

const groupWithStudentSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  students: [studentGroupHistorySchema],
  madrassaId: { type: mongoose.Schema.Types.ObjectId, ref: 'madrassa', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupWithStudent', groupWithStudentSchema);