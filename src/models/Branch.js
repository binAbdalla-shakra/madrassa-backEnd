const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    name: { type: String, required: true },
    madrassaId: { type: mongoose.Schema.Types.ObjectId, ref: 'madrassa', required: true },
    address: String,
    contactNumber: String,
    createdAt: { type: Date, default: Date.now },
    CreatedBy: { type: String, required: true },
    ModifiedAt:  Date,
    ModifiedBy:  String,
});

module.exports = mongoose.model('Branch', branchSchema);
