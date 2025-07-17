const GeneratedFee = require('../models/GeneratedFee');
const Parent = require('../models/Parent');
const Student = require('../models/Student');

// Generate monthly fees for parents
exports.generateMonthlyFees = async (req, res) => {
    try {
        // const currentDate = new Date();
        // const month = currentDate.getMonth() + 1;
        // const year = currentDate.getFullYear();
        const { month, year } = req.body;

        // Get all parents with active students
        const parentsWithStudents = await Student.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: "$parent",
                    studentCount: { $sum: 1 },
                    totalMonthlyFee: { $sum: "$monthlyFee" }
                }
            }
        ]);

        // Process each parent
        for (const parentData of parentsWithStudents) {
            const parent = await Parent.findById(parentData._id);
            if (!parent) continue;

            // Calculate discount
            let discountAmount = 0;
            if (parent.isDiscountPercent) {
                discountAmount = (parentData.totalMonthlyFee * parent.discountPercent) / 100;
            } else {
                discountAmount = Math.min(parent.discountAmount, parentData.totalMonthlyFee);
            }

            const totalAmount = parentData.totalMonthlyFee - discountAmount;

            // Create or update generated fee
            await GeneratedFee.findOneAndUpdate(
                { parent: parent._id, month, year },
                {
                    studentCount: parentData.studentCount,
                    baseAmount: parentData.totalMonthlyFee,
                    discountAmount,
                    totalAmount,
                    status: 'pending',
                    dueDate: new Date(year, month, 15), // Due on 15th of next month
                },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({
            success: true,
            message: `Monthly fees generated for ${month}/${year}`,
            data: {
                month,
                year,
                parentsProcessed: parentsWithStudents.length
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

// Get fees for a parent
exports.getParentFees = async (req, res) => {
    try {
        const { parentId } = req.params;
        const { month, year, status } = req.query;

        const query = { parent: parentId };
        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);
        if (status) query.status = status;

        const fees = await GeneratedFee.find(query)
            .sort({ year: 1, month: 1 });

        res.status(200).json({
            success: true,
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



// In your backend controller
exports.getParentsWithActiveStudents = async (req, res) => {
  try {
    const parents = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$parent",
          studentCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "parents",
          localField: "_id",
          foreignField: "_id",
          as: "parent"
        }
      },
      { $unwind: "$parent" },
      {
        $project: {
          _id: "$parent._id",
          name: "$parent.name",
          contact: "$parent.contact",
          studentCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: parents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching parents',
      error: error.message
    });
  }
};



// Add to your feeController.js
exports.getGeneratedFees = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const fees = await GeneratedFee.find(query)
      .populate('parent', 'name contact')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: fees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching generated fees',
      error: error.message
    });
  }
};



exports.checkFeesExist = async (req, res) => {
  try {
    const { month, year } = req.query;
    const count = await GeneratedFee.countDocuments({ month, year });
    res.status(200).json({
      success: true,
      exists: count > 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking existing fees',
      error: error.message
    });
  }
};



exports.getPendingFeesForParent = async (req, res) => {
    try {
        const { parentId } = req.params;
        const { status } = req.query;

        // Validate parent exists
        const parent = await Parent.findById(parentId);
        if (!parent) {
            return res.status(404).json({
                success: false,
                message: 'Parent not found'
            });
        }

        // Build query
        const query = { parent: parentId };
        
        // Add status filter if provided
        if (status) {
            query.status = status.toLowerCase(); // ensures case insensitivity
        }

        // Get fees with optional status filter
        const fees = await GeneratedFee.find(query)
            // .populate('students', 'name')
            .populate('parent', 'name email phone')
            .sort({ dueDate: 1 }); // Sort by due date ascending

        res.status(200).json({
            success: true,
            count: fees.length,
            data: fees
        });

    } catch (error) {
        console.error('Error fetching parent fees:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};