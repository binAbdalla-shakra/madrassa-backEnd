const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  // Gender enum
  gender: {
    type: String,
    enum: ['Male', 'Female'],
  },
  birthdate: { type: Date },
  // Academic fields
  admissionDate: { type: Date, default: Date.now },
  registrationNumber: { type: String, unique: true, sparse: true },
  // Parent relation (optional)
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
  isActive: { type: Boolean, default: true },
  monthlyFee: { type: Number, default: 15, min: 0 },
  // Multi-company identifiers
  madrassaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'madrassa',
    required: true
  },

  // Auditing fields
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  modifiedAt: { type: Date },
  modifiedBy: { type: String },
});

module.exports = mongoose.model('Student', studentSchema);
