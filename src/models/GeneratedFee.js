const mongoose = require('mongoose');

const generatedFeeSchema = new mongoose.Schema({
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    studentCount: { type: Number, required: true, min: 1 },
    baseAmount: { type: Number, required: true }, // Total before discount
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }, // After discount
    paidAmount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'partial', 'paid'],
        default: 'pending'
    },
    dueDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

generatedFeeSchema.index({ parent: 1, month: 1, year: 1 }, { unique: true });

generatedFeeSchema.pre('save', function (next) {
    this.updatedAt = new Date();

    // Update status based on payments
    if (this.paidAmount >= this.totalAmount) {
        this.status = 'paid';
    } else if (this.paidAmount > 0) {
        this.status = 'partial';
    } else {
        this.status = 'pending';
    }

    next();
});

// Add this to your GeneratedFee model
generatedFeeSchema.statics.updatePayment = async function (feeId, amountPaid) {
    const fee = await this.findById(feeId);
    if (!fee) throw new Error('Fee not found');

    fee.paidAmount += amountPaid;

    // Update status
    if (fee.paidAmount >= fee.totalAmount) {
        fee.status = 'paid';
    } else if (fee.paidAmount > 0) {
        fee.status = 'partial';
    } else {
        fee.status = 'pending';
    }

    await fee.save();
    return fee;
};

module.exports = mongoose.model('GeneratedFee', generatedFeeSchema);