const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    expenseType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseType',
        required: true
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    description: { type: String },
    paidTo: { type: String },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank', 'wallet'],
        required: true
    },
    approvedBy: { type: String },
    receiptAttachment: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

expenseSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Expense', expenseSchema);