const Receipt = require('../models/Receipt');
const GeneratedFee = require('../models/GeneratedFee');
const mongoose = require('mongoose');

// Generate a new receipt
exports.createReceipt = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { parentId } = req.params;
        const { feeId, amountPaid, paymentMethod, notes, receivedBy } = req.body;

        // Validate fee belongs to parent
        const fee = await GeneratedFee.findOne({ _id: feeId }).session(session);
        if (!fee) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Fee record not found for this parent"
            });
        }


        //  PREVENT DUPLICATE PAYMENT
        if (fee.status === "paid" || fee.paidAmount >= fee.totalAmount) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "This fee is already fully paid. No more payments allowed."
            });
        }

        // Generate receipt number
        const lastReceipt = await Receipt.findOne().sort({ receiptNumber: -1 }).session(session);

        let receiptNumber = "RCPT-00001";
        if (lastReceipt) {
            const lastNum = parseInt(lastReceipt.receiptNumber.split("-")[1]);
            receiptNumber = `RCPT-${String(lastNum + 1).padStart(5, "0")}`;
        }
        // Create receipt
        const receipt = new Receipt({
            receiptNumber,
            parent: parentId,
            fee: feeId,
            amountPaid,
            paymentMethod,
            receivedBy,
            notes
        });

        await receipt.save({ session });

        //  DIRECT PAYMENT LOGIC (no static method)
        fee.paidAmount += amountPaid;
        fee.receiptedBy = receivedBy;

        // Status logic
        if (fee.paidAmount >= fee.totalAmount) {
            fee.status = "paid";
        } else if (fee.paidAmount > 0) {
            fee.status = "partial";
        }

        await fee.save({ session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            success: true,
            data: receipt
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return res.status(500).json({
            success: false,
            message: "Error creating receipt",
            error: error.message
        });
    }
};

// exports.createReceipt = async (req, res) => {
//     try {
//         const { parentId } = req.params;
//         const { feeId, amountPaid, paymentMethod, notes, receivedBy } = req.body;

//         // Validate the fee belongs to this parent
//         const fee = await GeneratedFee.findOne({ _id: feeId, parent: parentId });
//         if (!fee) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Fee record not found for this parent'
//             });
//         }

//         // Get the last receipt number
//         const lastReceipt = await Receipt.findOne().sort({ receiptNumber: -1 });
//         let receiptNumber = 'RCPT-00001'; // Default first receipt

//         if (lastReceipt) {
//             const lastNum = parseInt(lastReceipt.receiptNumber.split('-')[1]);
//             receiptNumber = `RCPT-${String(lastNum + 1).padStart(5, '0')}`;
//         }

//         // Create receipt
//         const receipt = new Receipt({
//             receiptNumber,
//             parent: parentId,
//             fee: feeId,
//             amountPaid,
//             paymentMethod,
//             receivedBy,
//             notes
//         });

//         await receipt.save();

//         // Update fee status and paid amount
//         await GeneratedFee.recordPayment(feeId, amountPaid, receivedBy);
//         res.status(201).json({
//             success: true,
//             data: receipt
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error creating receipt',
//             error: error.message
//         });
//     }
// };

// Get receipts for a parent
exports.getParentReceipts = async (req, res) => {
    try {
        const { parentId } = req.params;
        const { startDate, endDate } = req.query;

        const query = { parent: parentId };

        if (startDate && endDate) {
            query.paymentDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const receipts = await Receipt.find(query)
            .populate('fee')
            .sort({ paymentDate: -1 });

        res.status(200).json({
            success: true,
            data: receipts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching receipts',
            error: error.message
        });
    }
};