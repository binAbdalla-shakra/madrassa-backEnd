const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    receiptNumber: { type: String, required: true, unique: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
    fee: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneratedFee' },
    amountPaid: { type: Number, required: true, min: 0 },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank','wallet'],
        required: true
    },
    paymentDate: { type: Date, default: Date.now },
    receivedBy: { type: String },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

receiptSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Receipt', receiptSchema);