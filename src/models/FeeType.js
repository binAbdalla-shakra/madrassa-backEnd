const mongoose = require('mongoose');

const feeTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['tuition', 'admission', 'graduation', 'exam', 'activity', 'transport', 'other'],
        default: 'tuition'
    },
    description: { 
        type: String,
        trim: true
    },
    amount: { 
        type: Number, 
        required: true,
        min: 0
    },
    isRecurring: { 
        type: Boolean, 
        default: false 
    },
    frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly', 'one-time', null],
        default: null
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    appliesTo: {
        type: String,
        enum: ['all', 'active', 'new', 'graduating', 'specific'],
        default: 'active'
    },
    createdBy : {type: String},
    updatedBy : {type: String},

    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

feeTypeSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Validate recurring settings
    if (this.isRecurring && !this.frequency) {
        throw new Error('Recurring fee types must have a frequency');
    }
    
    next();
});

module.exports = mongoose.model('FeeType', feeTypeSchema);