const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const User = require('../models/User');
const Group = require('../models/Group');
const GroupWithStudent = require('../models/GroupWithStudent');



// Create attendance record for a student
exports.createAttendance = async (req, res) => {
    try {
        const { date, student_id, teacher_id, status, notes } = req.body;

        // Validate student exists
        const student = await Student.findById(student_id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check for existing attendance for this student on this date
        const existingAttendance = await Attendance.findOne({
            student: student_id,
            date: new Date(date)
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already recorded for this student on this date'
            });
        }

        const attendance = new Attendance({
            date,
            student: student_id,
            teacher: teacher_id,
            status,
            notes
        });

        await attendance.save();

        res.status(201).json({
            success: true,
            data: attendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating attendance',
            error: error.message
        });
    }
};

// Get attendance records with filters
exports.getAttendance = async (req, res) => {
    try {
        const { student_id, teacher_id, status, start_date, end_date } = req.query;

        const query = {};

        if (student_id) query.student = student_id;
        if (teacher_id) query.teacher = teacher_id;
        if (status) query.status = status;

        if (start_date || end_date) {
            query.date = {};
            if (start_date) query.date.$gte = new Date(start_date);
            if (end_date) query.date.$lte = new Date(end_date);
        }

        const attendance = await Attendance.find(query)
            .populate('student', 'name')
            // .populate('teacher', 'name')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance',
            error: error.message
        });
    }
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const updatedAttendance = await Attendance.findByIdAndUpdate(
            id,
            { status, notes },
            { new: true, runValidators: true }
        ).populate('student', 'name');

        if (!updatedAttendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedAttendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating attendance',
            error: error.message
        });
    }
};

// Bulk attendance creation
exports.createBulkAttendance = async (req, res) => {
    try {
        const { date, teacher_id, attendance_data } = req.body;

        // Validate all students exist
        const studentIds = attendance_data.map(a => a.student_id);
        const students = await Student.find({ _id: { $in: studentIds } });

        if (students.length !== studentIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more students not found'
            });
        }

        // Check for existing attendance records
        const existingRecords = await Attendance.find({
            student: { $in: studentIds },
            date: new Date(date)
        });

        if (existingRecords.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already recorded for some students on this date',
                existing_records: existingRecords
            });
        }

        // Prepare attendance records
        const attendanceRecords = attendance_data.map(record => ({
            date,
            student: record.student_id,
            teacher: teacher_id,
            status: record.status,
            notes: record.notes || ''
        }));

        // Insert all records
        const createdAttendance = await Attendance.insertMany(attendanceRecords);

        res.status(201).json({
            success: true,
            count: createdAttendance.length,
            data: createdAttendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating bulk attendance',
            error: error.message
        });
    }
};



// Get All Students
exports.getStudentsByTeacherGroup = async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Get the teacher ID from the user
        const user = await User.findById(userId)
            .select('Teacher')
            .populate('Teacher', '_id');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const teacherId = user.Teacher._id;

        // 2. Find all groups assigned to this teacher
        const groups = await Group.find({ teacherId })
            .select('_id name');

        if (!groups || groups.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: 'No groups found for this teacher'
            });
        }

        const groupIds = groups.map(group => group._id);

        // 3. Find all students in these groups
        const groupStudents = await GroupWithStudent.find({
            groupId: { $in: groupIds }
        })
            .populate({
                path: 'students.studentId',
                select: 'name rollNumber fatherName contactNumber isActive',
                match: { isActive: true }  // Only populate active students
            })
            .populate('groupId', 'name');

        // 4. Format the response
        const result = groupStudents.map(group => ({
            groupId: group.groupId._id,
            groupName: group.groupId.name,
            students: group.students
                .filter(student =>
                    !student.leaveDate && // Current students
                    student.studentId && // Ensure student exists (from population match)
                    student.studentId.isActive // Explicit active check
                )
                .map(student => ({
                    studentId: student.studentId._id,
                    name: student.studentId.name,
                    rollNumber: student.studentId.rollNumber,
                    fatherName: student.studentId.fatherName,
                    contactNumber: student.studentId.contactNumber,
                    joinDate: student.joinDate,
                    isActive: student.studentId.isActive // Include active status
                }))
        }));

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};