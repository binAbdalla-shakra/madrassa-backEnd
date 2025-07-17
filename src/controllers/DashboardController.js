const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Group = require('../models/Group');
const Teacher = require('../models/Teacher');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const ExpenseType = require('../models/ExpenseType');

exports.getDashboardStats = async (req, res) => {
    try {
        // Get madrassaId from authenticated user
        // const authUser = JSON.parse(sessionStorage.getItem("authUser"));
        // const madrassaId = authUser?.data?.user?.madrassaId;

        // if (!madrassaId) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Madrassa ID is required'
        //     });
        // }

        // Run all queries in parallel for better performance
        const [
            activeStudentsCount,
            parentsCount,
            activeTeachersCount,
            activeGroupsCount,
            latestStudents
        ] = await Promise.all([
            // 1. Count active students
            Student.countDocuments({ 
                // madrassaId,
                isActive: true 
            }),

            // 2. Count all parents
            Parent.countDocuments({  status:"Active"}),

            // 3. Count active teachers
            Teacher.countDocuments({ 
                status:"Active"
            }),

            // 4. Count active groups
            Group.countDocuments({ 
                // madrassaId,
                // isActive: true 
            }),

            // 5. Get last 5 registered students with parent info
            Student.find({  })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('parent', 'name contactNumber')
                .select('name registrationNumber admissionDate parent')
                .lean()
        ]);

        // Prepare the response
        const response = {
            success: true,
            data: {
                stats: {
                    activeStudents: activeStudentsCount,
                    parents: parentsCount,
                    activeTeachers: activeTeachersCount,
                    activeGroups: activeGroupsCount
                },
                latestStudents: latestStudents.map(student => ({
                    name: student.name,
                    registrationNumber: student.registrationNumber,
                    admissionDate: student.admissionDate,
                    parentName: student.parent?.name || 'Not assigned',
                    parentContact: student.parent?.contactNumber || 'Not available'
                }))
            }
        };

        res.status(200).json(response);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};