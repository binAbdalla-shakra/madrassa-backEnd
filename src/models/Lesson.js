const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    lessonDate: { type: Date, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    surah_number: { type: Number, required: true, min: 1, max: 114 },
    surah_name: { type: String, required: true },
    from_ayah: { type: Number, required: true, min: 1 },
    to_ayah: { type: Number, required: true, min: 1 },
    is_concluded: { type: Boolean, default: false },
    feedback: { type: String },
    notes: { type: String },
    materials_used: [String],
    homework_assigned: { type: String },
    status: {
        type: String,
        enum: ['completed', 'repeated'],
        default: 'completed'
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

lessonSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model('Lesson', lessonSchema);