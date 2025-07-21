const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, sparse: true },
  contactNumber: { type: String, unique: true, required: true },
  address: String,
  gender: { type: String, enum: ['Male', 'Female'], required: true },

  // Optional: Subject/Designation
  specialization: { type: String },
  shift: { type: String, enum: ['Morning', 'Afternoon', "FullTime"] },
  baseSalary: { type: Number, required: true },

  // Multi-Company support
  madrassaId: { type: mongoose.Schema.Types.ObjectId, ref: 'madrassa', required: true },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },

  // Audit fields
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  modifiedAt: Date,
  modifiedBy: String
});

module.exports = mongoose.model('Teacher', teacherSchema);
