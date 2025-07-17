const Lesson = require('../models/Lesson');
const Student = require('../models/Student');
const GroupWithStudent = require('../models/GroupWithStudent')
const mongoose = require('mongoose');

// Lesson Summary Report
exports.getLessonSummary = async (req, res) => {
    try {
        const { studentId, teacherId, startDate, endDate, status, isConcluded, surahNumber } = req.query;

        const matchQuery = {};

        if (studentId) matchQuery.student = new mongoose.Types.ObjectId(studentId); 
        if (teacherId) matchQuery.teacher = new mongoose.Types.ObjectId(teacherId);
        if (status) matchQuery.status = status;
        if (isConcluded !== undefined) matchQuery.is_concluded = isConcluded;
        if (surahNumber) matchQuery.surah_number = parseInt(surahNumber);

        if (startDate || endDate) {
            matchQuery.lessonDate = {};
            if (startDate) matchQuery.lessonDate.$gte = new Date(startDate);
            if (endDate) matchQuery.lessonDate.$lte = new Date(endDate);
        }

        const summary = await Lesson.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalLessons: { $sum: 1 },
                    completedLessons: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                    pendingLessons: { $sum: { $cond: [{ $ne: ["$status", "completed"] }, 1, 0] } },
                    uniqueSurahs: { $addToSet: "$surah_number" },
                    avgAyahsCovered: { $avg: { $subtract: ["$to_ayah", "$from_ayah"] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalLessons: 1,
                    completedLessons: 1,
                    pendingLessons: 1,
                    uniqueSurahsCount: { $size: "$uniqueSurahs" },
                    avgAyahsCovered: { $round: ["$avgAyahsCovered", 1] }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: summary[0] || {
                totalLessons: 0,
                completedLessons: 0,
                pendingLessons: 0,
                uniqueSurahsCount: 0,
                avgAyahsCovered: 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating lesson summary',
            error: error.message
        });
    }
};

// Lesson Detail Report
exports.getLessonDetails = async (req, res) => {
    try {
        const { studentId, teacherId, startDate, endDate, status, isConcluded, surahNumber } = req.query;

        const matchQuery = {};

        if (studentId) matchQuery.student = studentId;
        if (teacherId) matchQuery.teacher = teacherId;
        if (status) matchQuery.status = status;
        if (isConcluded !== undefined) matchQuery.is_concluded = isConcluded;
        if (surahNumber) matchQuery.surah_number = parseInt(surahNumber);

        if (startDate || endDate) {
            matchQuery.lessonDate = {};
            if (startDate) matchQuery.lessonDate.$gte = new Date(startDate);
            if (endDate) matchQuery.lessonDate.$lte = new Date(endDate);
        }

        const lessons = await Lesson.find(matchQuery)
            .populate('student', 'name class')
            .populate('teacher', 'name')
            .sort({ lessonDate: -1 });

        // Group by surah for additional insights
        const surahProgress = lessons.reduce((acc, lesson) => {
            if (!acc[lesson.surah_number]) {
                acc[lesson.surah_number] = {
                    surah_name: lesson.surah_name,
                    lessonsCount: 0,
                    ayahsCovered: new Set()
                };
            }
            acc[lesson.surah_number].lessonsCount++;
            for (let i = lesson.from_ayah; i <= lesson.to_ayah; i++) {
                acc[lesson.surah_number].ayahsCovered.add(i);
            }
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            data: {
                lessons,
                summary: {
                    totalLessons: lessons.length,
                    byStatus: lessons.reduce((acc, lesson) => {
                        acc[lesson.status] = (acc[lesson.status] || 0) + 1;
                        return acc;
                    }, {}),
                    bySurah: Object.entries(surahProgress).map(([number, data]) => ({
                        surah_number: parseInt(number),
                        surah_name: data.surah_name,
                        lessons_count: data.lessonsCount,
                        ayahs_covered: data.ayahsCovered.size,
                        completion_percentage: Math.round((data.ayahsCovered.size / 114) * 100) // Assuming 114 ayahs max for example
                    }))
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating lesson details',
            error: error.message
        });
    }
};


// exports.getStudentsWithoutLessons = async (req, res) => {
//     try {
//         const { date } = req.query;

//         if (!date) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Date parameter is required'
//             });
//         }

//         // Find all students
//         const allStudents = await Student.find({}).lean();

//         // Find students who have lessons on the specified date
//         const studentsWithLessons = await Lesson.find({
//             lessonDate: {
//                 $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
//                 $lte: new Date(new Date(date).setHours(23, 59, 59, 999))
//             }
//         }).distinct('student');

//         // Filter out students who have lessons from all students
//         const studentsWithoutLessons = allStudents.filter(student => 
//             !studentsWithLessons.some(swl => swl.equals(student._id))
//         );

//         // Optionally filter active students only
//         // const activeStudentsWithoutLessons = studentsWithoutLessons.filter(s => s.isActive);

//         res.status(200).json({
//             success: true,
//             data: studentsWithoutLessons.map(student => ({
//                 _id: student._id,
//                 name: student.name,
//                 class: student.class,
//                 contact: student.contact,
//                 // Include any other relevant fields
//             }))
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error finding students without lessons',
//             error: error.message
//         });
//     }
// };


exports.getStudentsWithoutLessons = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date parameter is required'
            });
        }

        // Find all students
        const allStudents = await Student.find({}).lean();

        // Find students who have lessons on the specified date
        const studentsWithLessons = await Lesson.find({
            lessonDate: {
                $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(date).setHours(23, 59, 59, 999))
            }
        }).distinct('student');

        // Filter out students who have lessons from all students
        const studentsWithoutLessons = allStudents.filter(student => 
            !studentsWithLessons.some(swl => swl.equals(student._id))
        );

        // Get all group assignments for these students
        const groupAssignments = await GroupWithStudent.find({
            studentIds: { $in: studentsWithoutLessons.map(s => s._id) }
        }).populate('groupId');

        // Create a map of studentId to group name
        const studentGroupMap = {};
        groupAssignments.forEach(assignment => {
            assignment.studentIds.forEach(studentId => {
                if (!studentGroupMap[studentId]) {
                    studentGroupMap[studentId] = assignment.groupId.name;
                }
            });
        });

        // Prepare the response data with group names
        const responseData = studentsWithoutLessons.map(student => ({
            _id: student._id,
            name: student.name,
            groupName: studentGroupMap[student._id] || 'No group assigned', // Use group name instead of class
            contact: student.contact,
            // Include any other relevant fields
        }));

        res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error finding students without lessons',
            error: error.message
        });
    }
};