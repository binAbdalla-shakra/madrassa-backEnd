const Parent = require('../models/Parent');
const Student = require('../models/Student');
const GeneratedFee = require('../models/GeneratedFee');
const Receipt = require('../models/Receipt');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const ExpenseType = require('../models/ExpenseType');
// Get parent monthly finance report
// exports.getParentMonthlyReport = async (req, res) => {
//     try {
//         const { parentId } = req.params;

//         // 1. Get all generated fees for this parent
//         const generatedFees = await GeneratedFee.aggregate([
//             { $match: { parent: new mongoose.Types.ObjectId(parentId) } },
//             {
//                 $group: {
//                     _id: { month: '$month', year: '$year' },
//                     generatedAmount: { $sum: '$totalAmount' },
//                     feeCount: { $sum: 1 }
//                 }
//             },
//             { $sort: { '_id.year': 1, '_id.month': 1 } }
//         ]);

//         // 2. Get all receipts for this parent grouped by payment month
//         const receipts = await Receipt.aggregate([
//             { $match: { parent: new mongoose.Types.ObjectId(parentId) } },
//             {
//                 $group: {
//                     _id: {
//                         month: { $month: '$paymentDate' },
//                         year: { $year: '$paymentDate' }
//                     },
//                     receiptedAmount: { $sum: '$amountPaid' },
//                     receiptCount: { $sum: 1 }
//                 }
//             },
//             { $sort: { '_id.year': 1, '_id.month': 1 } }
//         ]);

//         // 3. Combine all months with activity
//         const allMonths = new Set();

//         // Add months with generated fees
//         generatedFees.forEach(f => {
//             allMonths.add(`${f._id.year}-${f._id.month.toString().padStart(2, '0')}`);
//         });

//         // Add months with receipts
//         receipts.forEach(r => {
//             allMonths.add(`${r._id.year}-${r._id.month.toString().padStart(2, '0')}`);
//         });

//         // 4. Create monthly summary with running balance
//         let runningBalance = 0;
//         const monthlyReport = Array.from(allMonths)
//             .sort()
//             .map(monthYear => {
//                 const [year, month] = monthYear.split('-');
//                 const monthInt = parseInt(month);
//                 const yearInt = parseInt(year);

//                 // Find generated amount for this month
//                 const generated = generatedFees.find(f =>
//                     f._id.month === monthInt && f._id.year === yearInt
//                 );

//                 // Find receipted amount for this month (payments made in this month)
//                 const receipted = receipts.find(r =>
//                     r._id.month === monthInt && r._id.year === yearInt
//                 );

//                 const monthGenerated = generated?.generatedAmount || 0;
//                 const monthReceipted = receipted?.receiptedAmount || 0;

//                 runningBalance += monthGenerated - monthReceipted;

//                 return {
//                     month: monthInt,
//                     year: yearInt,
//                     monthName: new Date(yearInt, monthInt - 1).toLocaleString('default', { month: 'long' }),
//                     generatedAmount: monthGenerated,
//                     receiptedAmount: monthReceipted,
//                     balance: runningBalance
//                 };
//             });

//         // 5. Get parent details
//         const parent = await Parent.findById(parentId);
//         const activeStudents = await Student.countDocuments({
//             parent: parentId,
//             isActive: true
//         });

//         res.status(200).json({
//             success: true,
//             data: {
//                 parent: {
//                     _id: parent._id,
//                     name: parent.name,
//                     contact: parent.contactNumber,
//                     discount: parent.isDiscountPercent ?
//                         `${parent.discountPercent}%` :
//                         `$${parent.discountAmount.toFixed(2)}`,
//                     activeStudents
//                 },
//                 monthlyReport,
//                 finalBalance: runningBalance,
//                 asText: generateTextReport(parent, activeStudents, monthlyReport)
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error generating report',
//             error: error.message
//         });
//     }
// };

// // Helper function to generate text report
// function generateTextReport(parent, activeStudents, monthlyData) {
//     let reportText = `Financial Report for ${parent.name}\n`;
//     reportText += `Contact: ${parent.contactNumber}\n`;
//     reportText += `Active Students: ${activeStudents}\n`;
//     reportText += `Discount: ${parent.isDiscountPercent? `${parent.discountPercent}%` :
//                         `$${parent.discountAmount.toFixed(2)}`}\n\n`;

//     monthlyData.forEach(month => {
//         reportText += `Generated $${month.generatedAmount.toFixed(2)} in ${month.monthName}, `;
//         reportText += `Receipted $${month.receiptedAmount.toFixed(2)} in ${month.monthName}\n`;
//     });

//     reportText += `\nFinal Balance: $${monthlyData.length > 0 ?
//         monthlyData[monthlyData.length - 1].balance.toFixed(2) : '0.00'}`;

//     return reportText;
// }

exports.getParentMonthlyReport = async (req, res) => {
    try {
        const { parentId } = req.params;

        // 1. Get all generated fees for this parent with details
        const generatedFees = await GeneratedFee.aggregate([
            { $match: { parent: new mongoose.Types.ObjectId(parentId) } },
            {
                $lookup: {
                    from: 'feetypes',
                    localField: 'feeType',
                    foreignField: '_id',
                    as: 'feeType'
                }
            },
            { $unwind: '$feeType' },
            {
                $group: {
                    _id: { month: '$month', year: '$year' },
                    generatedAmount: { $sum: '$totalAmount' },
                    feeCount: { $sum: 1 },
                    fees: {
                        $push: {
                            _id: '$_id',
                            feeType: '$feeType.name',
                            baseAmount: '$baseAmount',
                            discountAmount: '$discountAmount',
                            totalAmount: '$totalAmount',
                            paidAmount: '$paidAmount',
                            status: '$status',
                            dueDate: '$dueDate',
                            month: '$month',
                            year: '$year'
                        }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // 2. Get all receipts for this parent with the fees they paid
        const receipts = await Receipt.aggregate([
            { $match: { parent: new mongoose.Types.ObjectId(parentId) } },
            {
                $lookup: {
                    from: 'generatedfees',
                    localField: 'fee',
                    foreignField: '_id',
                    as: 'paidFee'
                }
            },
            {
                $unwind: {
                    path: '$paidFee',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'feetypes',
                    localField: 'paidFee.feeType',
                    foreignField: '_id',
                    as: 'paidFee.feeType'
                }
            },
            {
                $unwind: {
                    path: '$paidFee.feeType',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$paymentDate' },
                        year: { $year: '$paymentDate' }
                    },
                    receiptedAmount: { $sum: '$amountPaid' },
                    receiptCount: { $sum: 1 },
                    receipts: {
                        $push: {
                            _id: '$_id',
                            receiptNumber: '$receiptNumber',
                            paymentDate: '$paymentDate',
                            paymentMethod: '$paymentMethod',
                            amountPaid: '$amountPaid',
                            paidFee: {
                                $cond: [
                                    { $ifNull: ['$paidFee._id', false] },
                                    {
                                        feeId: '$paidFee._id',
                                        feeType: '$paidFee.feeType.name',
                                        feeMonth: '$paidFee.month',
                                        feeYear: '$paidFee.year',
                                        feeAmount: '$paidFee.totalAmount'
                                    },
                                    null
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    receiptedAmount: 1,
                    receiptCount: 1,
                    receipts: {
                        $map: {
                            input: '$receipts',
                            as: 'receipt',
                            in: {
                                _id: '$$receipt._id',
                                receiptNumber: '$$receipt.receiptNumber',
                                paymentDate: '$$receipt.paymentDate',
                                paymentMethod: '$$receipt.paymentMethod',
                                amountPaid: '$$receipt.amountPaid',
                                paidFee: '$$receipt.paidFee'
                            }
                        }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // 3. Combine all months with activity
        const allMonths = new Set();

        // Add months with generated fees
        generatedFees.forEach(f => {
            allMonths.add(`${f._id.year}-${f._id.month.toString().padStart(2, '0')}`);
        });

        // Add months with receipts
        receipts.forEach(r => {
            allMonths.add(`${r._id.year}-${r._id.month.toString().padStart(2, '0')}`);
        });

        // 4. Create monthly summary with running balance and detailed payment info
        let runningBalance = 0;
        const monthlyReport = Array.from(allMonths)
            .sort()
            .map(monthYear => {
                const [year, month] = monthYear.split('-');
                const monthInt = parseInt(month);
                const yearInt = parseInt(year);

                // Find generated amount for this month
                const generated = generatedFees.find(f =>
                    f._id.month === monthInt && f._id.year === yearInt
                );

                // Find receipted amount for this month (payments made in this month)
                const receipted = receipts.find(r =>
                    r._id.month === monthInt && r._id.year === yearInt
                );

                const monthGenerated = generated?.generatedAmount || 0;
                const monthReceipted = receipted?.receiptedAmount || 0;

                runningBalance += monthGenerated - monthReceipted;

                return {
                    month: monthInt,
                    year: yearInt,
                    monthName: new Date(yearInt, monthInt - 1).toLocaleString('default', { month: 'long' }),
                    generatedAmount: monthGenerated,
                    receiptedAmount: monthReceipted,
                    balance: runningBalance,
                    generatedFees: generated?.fees || [],
                    receipts: receipted?.receipts || []
                };
            });

        // 5. Get parent details
        const parent = await Parent.findById(parentId);
        const activeStudents = await Student.countDocuments({
            parent: parentId,
            isActive: true
        });

        res.status(200).json({
            success: true,
            data: {
                parent: {
                    _id: parent._id,
                    name: parent.name,
                    contact: parent.contactNumber,
                    discount: parent.isDiscountPercent ?
                        `${parent.discountPercent}%` :
                        `$${parent.discountAmount.toFixed(2)}`,
                    activeStudents
                },
                monthlyReport,
                finalBalance: runningBalance,
                asText: generateTextReport(parent, activeStudents, monthlyReport)
            }
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating report',
            error: error.message
        });
    }
};

// Enhanced helper function to generate text report
function generateTextReport(parent, activeStudents, monthlyData) {
    let reportText = `Financial Report for ${parent.name}\n`;
    reportText += `Contact: ${parent.contactNumber}\n`;
    reportText += `Active Students: ${activeStudents}\n`;
    reportText += `Discount: ${parent.isDiscountPercent ? `${parent.discountPercent}%` :
        `$${parent.discountAmount.toFixed(2)}`}\n\n`;

    monthlyData.forEach(month => {
        reportText += `=== ${month.monthName} ${month.year} ===\n`;
        reportText += `Generated: $${month.generatedAmount.toFixed(2)}\n`;

        // Show generated fees details
        if (month.generatedFees.length > 0) {
            reportText += `  Generated Fees:\n`;
            month.generatedFees.forEach(fee => {
                reportText += `  - ${fee.feeType}: $${fee.totalAmount.toFixed(2)}`;
                reportText += ` (Base: $${fee.baseAmount.toFixed(2)}, Discount: $${fee.discountAmount.toFixed(2)})`;
                reportText += ` | Status: ${fee.status}\n`;
            });
        }

        reportText += `Receipted: $${month.receiptedAmount.toFixed(2)}\n`;

        // Show receipt details
        if (month.receipts.length > 0) {
            reportText += `  Receipts:\n`;
            month.receipts.forEach(receipt => {
                reportText += `  - Receipt #${receipt.receiptNumber}: $${receipt.amountPaid.toFixed(2)}`;
                reportText += ` (${receipt.paymentMethod}, ${receipt.paymentDate.toISOString().split('T')[0]})\n`;

                // Show which fee was paid by this receipt
                if (receipt.paidFee) {
                    reportText += `    * Paid for ${receipt.paidFee.feeType} `;
                    reportText += `(${receipt.paidFee.feeMonth}/${receipt.paidFee.feeYear})\n`;
                }
            });
        }

        reportText += `Balance: $${month.balance.toFixed(2)}\n\n`;
    });

    reportText += `=== FINAL BALANCE ===\n`;
    reportText += `$${monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].balance.toFixed(2) : '0.00'}`;

    return reportText;
}
// Monthly Expense Report
exports.getExpenseReport = async (req, res) => {
    try {
        const { year, month, expenseType } = req.query;

        // Build the match query
        const matchQuery = {};

        // Date filtering
        if (year || month) {
            const dateConditions = [];

            if (year) {
                dateConditions.push({
                    $expr: { $eq: [{ $year: '$date' }, parseInt(year)] }
                });
            }

            if (month) {
                dateConditions.push({
                    $expr: { $eq: [{ $month: '$date' }, parseInt(month)] }
                });
            }

            if (dateConditions.length > 0) {
                matchQuery.$and = dateConditions;
            }
        }

        // Expense type filtering
        if (expenseType) {
            matchQuery.expenseType = new mongoose.Types.ObjectId(expenseType);
        }

        // Aggregate pipeline
        const report = await Expense.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'expensetypes',
                    localField: 'expenseType',
                    foreignField: '_id',
                    as: 'expenseType'
                }
            },
            { $unwind: '$expenseType' },
            {
                $group: {
                    _id: {
                        month: { $month: '$date' },
                        year: { $year: '$date' },
                        expenseType: '$expenseType.name'
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.expenseType': 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error generating expense report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating expense report',
            error: error.message
        });
    }
};

const buildDateFilter = (start, end, fieldName) => {
    const filter = {};
    if (start || end) {
        filter[fieldName] = {};
        if (start) filter[fieldName].$gte = new Date(start);
        if (end) filter[fieldName].$lte = new Date(end);
    }
    return Object.keys(filter).length > 0 ? filter : {};
};
// General Finance Summary Report
exports.getFinanceSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Helper function to build date filter for each model


        // Create date filters for each model
        const feeFilter = buildDateFilter(startDate, endDate, 'createdAt');
        const receiptFilter = buildDateFilter(startDate, endDate, 'paymentDate');
        const expenseFilter = buildDateFilter(startDate, endDate, 'date');

        // Get fee totals
        const feeSummary = await GeneratedFee.aggregate([
            { $match: feeFilter },
            {
                $group: {
                    _id: null,
                    totalGenerated: { $sum: '$totalAmount' },
                    totalPaid: { $sum: '$paidAmount' },
                    totalPending: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } }
                }
            }
        ]);

        // Get expense totals
        const expenseSummary = await Expense.aggregate([
            { $match: expenseFilter },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get receipt totals
        const receiptSummary = await Receipt.aggregate([
            { $match: receiptFilter },
            {
                $group: {
                    _id: null,
                    totalReceipts: { $sum: '$amountPaid' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                fees: feeSummary[0] || { totalGenerated: 0, totalPaid: 0, totalPending: 0 },
                expenses: expenseSummary[0] || { totalExpenses: 0, count: 0 },
                receipts: receiptSummary[0] || { totalReceipts: 0, count: 0 },
                netBalance: (receiptSummary[0]?.totalReceipts || 0) - (expenseSummary[0]?.totalExpenses || 0)
            }
        });
    } catch (error) {
        console.error('Error in getFinanceSummary:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating finance summary',
            error: error.message
        });
    }
};

// General Finance Detail Report
exports.getFinanceDetails = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const feeFilter = buildDateFilter(startDate, endDate, 'createdAt');
        const receiptFilter = buildDateFilter(startDate, endDate, 'paymentDate');
        const expenseFilter = buildDateFilter(startDate, endDate, 'date');

        // Get all financial data
        const [fees, receipts, expenses] = await Promise.all([
            GeneratedFee.find(feeFilter)
                .populate('parent', 'name contact')
                .sort({ year: 1, month: 1 }),
            Receipt.find(receiptFilter)
                .populate('parent', 'name contact')
                .sort({ paymentDate: -1 }),
            Expense.find(expenseFilter)
                .populate('expenseType', 'name')
                .populate('approvedBy', 'name')
                .sort({ date: -1 })
        ]);

        res.status(200).json({
            success: true,
            data: {
                fees,
                receipts,
                expenses,
                summary: {
                    totalFees: fees.reduce((sum, fee) => sum + fee.totalAmount, 0),
                    totalPaid: fees.reduce((sum, fee) => sum + fee.paidAmount, 0),
                    totalPending: fees.reduce((sum, fee) => sum + (fee.totalAmount - fee.paidAmount), 0),
                    totalReceipts: receipts.reduce((sum, receipt) => sum + receipt.amountPaid, 0),
                    totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
                    netBalance: receipts.reduce((sum, receipt) => sum + receipt.amountPaid, 0) -
                        expenses.reduce((sum, expense) => sum + expense.amount, 0)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating finance details',
            error: error.message
        });
    }
};


exports.getMonthlyFinanceSummary = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

        // Receipt: Revenue grouped by month
        const revenueByMonth = await Receipt.aggregate([
            {
                $match: {
                    paymentDate: { $gte: yearStart, $lte: yearEnd }
                }
            },
            {
                $group: {
                    _id: { month: { $month: "$paymentDate" } },
                    revenue: { $sum: "$amountPaid" }
                }
            }
        ]);

        // Expense: Expenses grouped by month
        const expenseByMonth = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: yearStart, $lte: yearEnd }
                }
            },
            {
                $group: {
                    _id: { month: { $month: "$date" } },
                    expenses: { $sum: "$amount" }
                }
            }
        ]);

        // Build a merged map from both datasets
        const monthlyMap = {};

        // Fill revenue data
        revenueByMonth.forEach(entry => {
            const month = entry._id.month;
            monthlyMap[month] = {
                month,
                revenue: entry.revenue,
                expenses: 0
            };
        });

        // Fill expenses data (merge into map)
        expenseByMonth.forEach(entry => {
            const month = entry._id.month;
            if (!monthlyMap[month]) {
                monthlyMap[month] = {
                    month,
                    revenue: 0,
                    expenses: entry.expenses
                };
            } else {
                monthlyMap[month].expenses = entry.expenses;
            }
        });

        // Ensure all 12 months are present
        const monthly = [];
        for (let i = 1; i <= 12; i++) {
            monthly.push({
                month: i,
                revenue: monthlyMap[i]?.revenue || 0,
                expenses: monthlyMap[i]?.expenses || 0
            });
        }

        res.status(200).json({
            success: true,
            monthly
        });
    } catch (error) {
        console.error("Error in getMonthlyFinanceSummary:", error);
        res.status(500).json({
            success: false,
            message: "Error generating monthly finance summary",
            error: error.message
        });
    }
};
