const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    teacher: { type: String},
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        required: true
    },
    notes: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

attendanceSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

// Compound index for student and date
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);