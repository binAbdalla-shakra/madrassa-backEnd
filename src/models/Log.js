const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  entity: {
    type: String,
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  performedBy: {
    type: String, // Username or userId
    required: true,
  },
  madrassaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'madrassa',
    required: true,
  },
  // branchId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Branch',
  //   required: true,
  // },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Log', logSchema);
