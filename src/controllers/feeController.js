const GeneratedFee = require('../models/GeneratedFee');
const FeeType = require('../models/FeeType');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
// Generate Monthly Tuition Fees
exports.generateMonthlyFees = async (req, res) => {
    try {

        const { month, year, createdBy } = req.body;

        // Get the tuition fee type
        const tuitionFeeType = await FeeType.findOne({
            category: 'tuition',
            isActive: true
        });

        if (!tuitionFeeType) {
            return res.status(400).json({
                success: false,
                message: 'Tuition fee type not configured'
            });
        }

        // Get all parents with active students
        const parentsWithStudents = await Student.aggregateActiveStudentsByParent();

        const generatedFees = [];
        const dueDate = new Date(year, month, 15); // Due on 15th of next month

        for (const parentData of parentsWithStudents) {
            const parent = await Parent.findById(parentData._id);
            if (!parent) continue;

            // Skip parents with 100% discount
            if (parent.isDiscountPercent && parent.discountPercent === 100) {
                continue;
            }
            // Calculate base amount
            const baseAmount = tuitionFeeType.amount * parentData.studentCount;

            // Apply discount
            let discountAmount = 0;
            if (parent.isDiscountPercent) {
                discountAmount = (baseAmount * parent.discountPercent) / 100;
            } else {
                discountAmount = Math.min(parent.discountAmount, baseAmount);
            }

            const totalAmount = baseAmount - discountAmount;

            const fee = await GeneratedFee.findOneAndUpdate(
                {
                    parent: parent._id,
                    feeType: tuitionFeeType._id,
                    month,
                    year
                },
                {
                    studentCount: parentData.studentCount,
                    baseAmount,
                    discountAmount,
                    totalAmount,
                    status: 'pending',
                    dueDate,
                    createdBy: createdBy
                },
                { upsert: true, new: true }
            );

            generatedFees.push(fee);
        }

        res.status(200).json({
            success: true,
            message: `Monthly tuition fees generated for ${month}/${year}`,
            data: {
                month,
                year,
                parentsProcessed: parentsWithStudents.length,
                fees: generatedFees
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating monthly fees',
            error: error.message
        });
    }
};

// Generate Custom Fee for Specific Parent
exports.generateCustomFee = async (req, res) => {
    try {

        const { feeTypeId, parentId, studentCount, totalAmount, discountAmount, dueDate, notes, createdBy } = req.body;

        // Validate fee type
        const feeType = await FeeType.findById(feeTypeId);
        if (!feeType || !feeType.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive fee type'
            });
        }

        // Validate parent
        const parent = await Parent.findById(parentId);
        if (!parent) {
            return res.status(404).json({
                success: false,
                message: 'Parent not found'
            });
        }



        const parentsActiveStudents = await Student.aggregate([
            { $match: { isActive: true, parent: new mongoose.Types.ObjectId(parentId) } },
            {
                $group: {
                    _id: "$parent",
                    studentCount: { $sum: 1 }
                }
            }
        ]);

        const count = parentsActiveStudents[0]?.studentCount || 0;
        // console.log(count, studentCount, parentsActiveStudents);
        if (studentCount > count) {
            return res.status(400).json({
                success: false,
                message: 'Student count exceeds parent\'s actual active students'
            });
        }


        // Calculate amounts
        const baseAmount = parseFloat(totalAmount) + parseFloat(discountAmount || 0);
        const calculatedTotal = baseAmount - parseFloat(discountAmount || 0);

        // Get current year if not provided
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;


        const fee = await GeneratedFee.create({
            parent: parentId,
            feeType: feeTypeId,
            year,
            month,
            studentCount,
            baseAmount,
            discountAmount: discountAmount || 0,
            totalAmount: calculatedTotal,
            status: 'pending',
            dueDate: new Date(dueDate),
            notes,
            createdBy: createdBy
        });

        res.status(201).json({
            success: true,
            message: `${feeType.name} fee generated for parent`,
            data: await fee.populate('feeType parent')
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating custom fee',
            error: error.message
        });
    }
};

// Bulk Generate Fees
exports.bulkGenerateFees = async (req, res) => {
    try {


        const { feeTypeId, feeData, createdBy } = req.body;
        // feeData = [{ parentId, studentCount, totalAmount, discountAmount, dueDate, notes }]

        // Validate fee type
        const feeType = await FeeType.findById(feeTypeId);
        if (!feeType || !feeType.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive fee type'
            });
        }

        const generatedFees = [];
        const errors = [];
        const year = new Date().getFullYear();

        // Process each fee in parallel
        await Promise.all(feeData.map(async (data) => {
            try {
                // Validate parent
                const parent = await Parent.findById(data.parentId);
                if (!parent) {
                    errors.push({
                        parentId: data.parentId,
                        error: 'Parent not found'
                    });
                    return;
                }

                // Calculate amounts
                const baseAmount = parseFloat(data.totalAmount) + parseFloat(data.discountAmount || 0);
                const calculatedTotal = baseAmount - parseFloat(data.discountAmount || 0);

                const fee = await GeneratedFee.create({
                    parent: data.parentId,
                    feeType: feeTypeId,
                    year,
                    studentCount: data.studentCount,
                    baseAmount,
                    discountAmount: data.discountAmount || 0,
                    totalAmount: calculatedTotal,
                    status: 'pending',
                    dueDate: new Date(data.dueDate),
                    notes: data.notes,
                    createdBy: createdBy
                });

                generatedFees.push(await fee.populate('parent'));
            } catch (error) {
                errors.push({
                    parentId: data.parentId,
                    error: error.message
                });
            }
        }));

        res.status(200).json({
            success: true,
            message: `Generated ${generatedFees.length} fees with ${errors.length} errors`,
            data: generatedFees,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error bulk generating fees',
            error: error.message
        });
    }
};

// Record Payment
exports.recordPayment = async (req, res) => {
    try {
        const { feeId, amount, createdBy } = req.body;

        const fee = await GeneratedFee.recordPayment(
            feeId,
            parseFloat(amount),
            createdBy
        );

        res.status(200).json({
            success: true,
            message: 'Payment recorded successfully',
            data: await fee.populate('feeType parent')
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error recording payment',
            error: error.message
        });
    }
};

// Cancel Fee
exports.cancelFee = async (req, res) => {
    try {
        const { feeId, reason, createdBy } = req.body;

        const fee = await GeneratedFee.cancelFee(
            feeId,
            createdBy,
            reason
        );

        res.status(200).json({
            success: true,
            message: 'Fee cancelled successfully',
            data: await fee.populate('feeType parent')
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling fee',
            error: error.message
        });
    }
};

// Get Fees for Parent
exports.getParentFees = async (req, res) => {
    try {
        const { parentId } = req.params;
        const { status, feeType, year, month } = req.query;

        const query = { parent: parentId };
        if (status) query.status = status;
        if (feeType) query.feeType = feeType;
        if (year) query.year = parseInt(year);
        if (month) query.month = parseInt(month);

        const fees = await GeneratedFee.find(query)
            .populate('feeType', 'name category amount')
            .populate('parent', 'name contact')
            .sort({ dueDate: 1 });

        res.status(200).json({
            success: true,
            count: fees.length,
            data: fees
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching parent fees',
            error: error.message
        });
    }
};

// Get All Generated Fees (Admin View)
exports.getAllFees = async (req, res) => {
    try {
        const { status, feeType, year, month, parent } = req.query;

        const query = {};
        if (status) query.status = status;
        if (feeType) query.feeType = feeType;
        if (year) query.year = parseInt(year);
        if (month) query.month = parseInt(month);
        if (parent) query.parent = parent;

        const fees = await GeneratedFee.find(query)
            .populate('feeType', 'name category')
            .populate('parent', 'name contact')
            .populate('createdBy', 'name')
            .sort({ dueDate: 1 });

        res.status(200).json({
            success: true,
            count: fees.length,
            data: fees
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching fees',
            error: error.message
        });
    }
};

// Check if Monthly Fees Exist
exports.checkMonthlyFeesExist = async (req, res) => {
    try {
        const { month, year } = req.query;

        const fees = await GeneratedFee.find({
            month: parseInt(month),
            year: parseInt(year),
        }).populate({
            path: 'feeType',
            match: { category: 'tuition' }
        });

        // Count only those where feeType was matched (not null)
        const count = fees.filter(fee => fee.feeType !== null).length;

        res.status(200).json({
            success: true,
            exists: count > 0,
            count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking existing fees',
            error: error.message
        });
    }
};

