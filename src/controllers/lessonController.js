const Lesson = require('../models/Lesson');
const Student = require('../models/Student');

// Create new lesson for a student
exports.createLesson = async (req, res) => {
    try {
        const {
            lessonDate,
            student,
            teacher,
            surah_number,
            surah_name,
            from_ayah,
            to_ayah,
            is_concluded,
            feedback,
            notes,
            materials_used,
            homework_assigned,
            status
        } = req.body;

        // Validate student exists
        const studentExists = await Student.findById(student);
        if (!studentExists) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Validate surah number
        if (surah_number < 1 || surah_number > 114) {
            return res.status(400).json({
                success: false,
                message: 'Surah number must be between 1 and 114'
            });
        }

        // Validate ayah range
        if (from_ayah < 1 || from_ayah > to_ayah) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ayah range'
            });
        }

        const lesson = new Lesson({
            lessonDate: lessonDate,
            student: student,
            teacher: teacher,
            surah_number,
            surah_name,
            from_ayah,
            to_ayah,
            is_concluded,
            feedback,
            notes,
            materials_used: materials_used || [],
            homework_assigned,
            status: status || 'completed'
        });

        await lesson.save();

        res.status(201).json({
            success: true,
            data: lesson
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating lesson',
            error: error.message
        });
    }
};

// Get lessons with filters (now by student)
exports.getLessons = async (req, res) => {
    try {
        const { student_id, teacher, surah_number, start_date, end_date, status, is_concluded } = req.query;

        const query = {};

        if (student_id) query.student = student_id;
        if (teacher) query.teacher = teacher;
        if (surah_number) query.surah_number = surah_number;
        if (status) query.status = status;
        if (is_concluded !== undefined) query.is_concluded = is_concluded;

        if (start_date || end_date) {
            query.lessonDate = {};
            if (start_date) query.lessonDate.$gte = new Date(start_date);
            if (end_date) query.lessonDate.$lte = new Date(end_date);
        }

        const lessons = await Lesson.find(query)
            .populate('student', 'name')
            // .populate('teacher', 'name')
            .sort({ lessonDate: -1 });

        res.status(200).json({
            success: true,
            count: lessons.length,
            data: lessons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching lessons',
            error: error.message
        });
    }
};

// Update lesson
exports.updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Validate ayah range if being updated
        if (updates.from_ayah || updates.to_ayah) {
            const lesson = await Lesson.findById(id);
            const fromAyah = updates.from_ayah || lesson.from_ayah;
            const toAyah = updates.to_ayah || lesson.to_ayah;

            if (fromAyah < 1 || fromAyah > toAyah) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ayah range'
                });
            }
        }

        const updatedLesson = await Lesson.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        }).populate('student', 'name');

        if (!updatedLesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedLesson
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating lesson',
            error: error.message
        });
    }
};