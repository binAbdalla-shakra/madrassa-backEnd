const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// Attendance Summary Report
exports.getAttendanceSummary = async (req, res) => {
    try {
        const { studentId, teacherId, start_date, end_date, status } = req.query;

        const matchQuery = {};

        if (studentId) matchQuery.student = new mongoose.Types.ObjectId(studentId); 
        if (teacherId) matchQuery.teacher = new mongoose.Types.ObjectId(teacherId);
        if (status) matchQuery.status = status;

        if (start_date || end_date) {
            matchQuery.date = {};
            if (start_date) matchQuery.date.$gte = new Date(start_date);
            if (end_date) matchQuery.date.$lte = new Date(end_date);
        }

        const summary = await Attendance.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalRecords: { $sum: 1 },
                    presentCount: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
                    absentCount: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
                    lateCount: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
                    excusedCount: { $sum: { $cond: [{ $eq: ["$status", "excused"] }, 1, 0] } },
                    attendanceRate: {
                        $avg: {
                            $cond: [
                                { $in: ["$status", ["present", "late"]] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalRecords: 1,
                    presentCount: 1,
                    absentCount: 1,
                    lateCount: 1,
                    excusedCount: 1,
                    attendanceRate: { $round: [{ $multiply: ["$attendanceRate", 100] }, 2] }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: summary[0] || {
                totalRecords: 0,
                presentCount: 0,
                absentCount: 0,
                lateCount: 0,
                excusedCount: 0,
                attendanceRate: 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating attendance summary',
            error: error.message
        });
    }
};

// Attendance Detail Report
exports.getAttendanceDetails = async (req, res) => {
    try {
        const { studentId, teacherId, start_date, end_date, status } = req.query;

        const matchQuery = {};

        if (studentId) matchQuery.student = studentId;
        if (teacherId) matchQuery.teacher = teacherId;
        if (status) matchQuery.status = status;

        if (start_date || end_date) {
            matchQuery.date = {};
            if (start_date) matchQuery.date.$gte = new Date(start_date);
            if (end_date) matchQuery.date.$lte = new Date(end_date);
        }

        const attendance = await Attendance.find(matchQuery)
            .populate('student', 'name class')
            .populate('teacher', 'name')
            .sort({ date: -1 });

        // Calculate monthly attendance trends
        const monthlyTrends = attendance.reduce((acc, record) => {
            const monthYear = `${record.date.getFullYear()}-${(record.date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!acc[monthYear]) {
                acc[monthYear] = {
                    present: 0,
                    total: 0
                };
            }
            acc[monthYear].total++;
            if (record.status === 'present' || record.status === 'late') {
                acc[monthYear].present++;
            }
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            data: {
                attendance,
                summary: {
                    totalRecords: attendance.length,
                    byStatus: attendance.reduce((acc, record) => {
                        acc[record.status] = (acc[record.status] || 0) + 1;
                        return acc;
                    }, {}),
                    monthlyTrends: Object.entries(monthlyTrends).map(([monthYear, data]) => ({
                        month: monthYear,
                        present: data.present,
                        total: data.total,
                        rate: Math.round((data.present / data.total) * 100)
                    }))
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating attendance details',
            error: error.message
        });
    }
};