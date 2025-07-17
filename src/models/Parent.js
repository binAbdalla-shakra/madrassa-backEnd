const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, sparse: true },
  contactNumber: { type: String, required: true },
  address: { type: String },

  gender: { type: String, enum: ['Male', 'Female'], required: true },

  // NEW DISCOUNT FIELDS
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  isDiscountPercent: {
    type: Boolean,
    default: false
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  discountPercent: {
    type: Number,
    default: 0
  },

  // Multi-company related fields
  madrassaId: { type: mongoose.Schema.Types.ObjectId, ref: 'madrassa', required: true },

  // Audit fields
  createdAt: { type: Date, default: Date.now },
  CreatedBy: { type: String, required: true },
  ModifiedAt: { type: Date },
  ModifiedBy: { type: String }
});

module.exports = mongoose.model('Parent', parentSchema);
