const Receipt = require('../models/Receipt');
const GeneratedFee = require('../models/GeneratedFee');

// Generate a new receipt
exports.createReceipt = async (req, res) => {
    try {
        const { parentId } = req.params;
        const { feeId, amountPaid, paymentMethod, notes, receivedBy } = req.body;

        // Validate the fee belongs to this parent
        const fee = await GeneratedFee.findOne({ _id: feeId, parent: parentId });
        if (!fee) {
            return res.status(400).json({
                success: false,
                message: 'Fee record not found for this parent'
            });
        }

        // Get the last receipt number
        const lastReceipt = await Receipt.findOne().sort({ receiptNumber: -1 });
        let receiptNumber = 'RCPT-00001'; // Default first receipt

        if (lastReceipt) {
            const lastNum = parseInt(lastReceipt.receiptNumber.split('-')[1]);
            receiptNumber = `RCPT-${String(lastNum + 1).padStart(5, '0')}`;
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

        await receipt.save();

        // Update fee status and paid amount
        try {
            const updatedFee = await GeneratedFee.updatePayment(feeId, amountPaid);
            console.log(`Updated fee status to: ${updatedFee.status}`);
        } catch (error) {
            console.error('Error updating fee status:', error);
            // Handle error if needed
        }

        res.status(201).json({
            success: true,
            data: receipt
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating receipt',
            error: error.message
        });
    }
};

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