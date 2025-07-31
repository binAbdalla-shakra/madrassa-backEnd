const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        required: function () {
            return !this.parentId; // Icon is only required for parent items
        },
        trim: true
    },
    link: {
        type: String,
        required: true,
        trim: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
        default: null
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
    },
    updatedBy: {
        type: String,
    }
});

// Update the updatedAt field before saving
menuSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Menu', menuSchema);