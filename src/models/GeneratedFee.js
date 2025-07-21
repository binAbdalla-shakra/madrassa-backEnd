const { CancellationToken } = require('mongodb');
const mongoose = require('mongoose');

const generatedFeeSchema = new mongoose.Schema({
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parent',
        required: true
    },
    feeType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeType',
        required: true
    },
    month: {
        type: Number,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    studentCount: {
        type: Number,
        min: 1
    },
    baseAmount: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'cancelled'],
        default: 'pending'
    },
    dueDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    CancellationReason: {
        type: String,
        trim: true
    },
    createdBy: {
        type: String
    },
    updatedBy: {
        type: String
    },
    cancelledBy: {
        type: String
    },
    receiptedBy: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

generatedFeeSchema.pre('save', function (next) {
    this.updatedAt = new Date();

    // Auto-calculate status based on payments
    if (this.paidAmount >= this.totalAmount) {
        this.status = 'paid';
    } else if (this.paidAmount > 0) {
        this.status = 'partial';
    } else if (this.status !== 'cancelled') {
        this.status = 'pending';
    }

    next();
});

// Static method for recording payments
generatedFeeSchema.statics.recordPayment = async function (feeId, amount, userId) {
    const fee = await this.findById(feeId);
    if (!fee) throw new Error('Fee not found');

    fee.paidAmount += amount;
    fee.receiptedBy = userId;

    if (fee.paidAmount >= fee.totalAmount) {
        fee.status = 'paid';
    } else if (fee.paidAmount > 0) {
        fee.status = 'partial';
    }

    await fee.save();
    return fee;
};

// Static method for cancelling a fee
generatedFeeSchema.statics.cancelFee = async function (feeId, userId, reason) {
    const fee = await this.findById(feeId);
    if (!fee) throw new Error('Fee not found');

    if (fee.status === 'paid') {
        throw new Error('Cannot cancel already paid fee');
    }

    fee.status = 'cancelled';
    fee.CancellationReason = reason || 'Fee cancelled';
    fee.cancelledBy = userId;

    await fee.save();
    return fee;
};

module.exports = mongoose.model('GeneratedFee', generatedFeeSchema);