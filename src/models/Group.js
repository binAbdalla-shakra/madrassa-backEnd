const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  description: { type: String },
  madrassaId: { type: mongoose.Schema.Types.ObjectId, ref: 'madrassa', required: true },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  modifiedAt: { type: Date },
  modifiedBy: { type: String }
});

module.exports = mongoose.model('Group', groupSchema);
