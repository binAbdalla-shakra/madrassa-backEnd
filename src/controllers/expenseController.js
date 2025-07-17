const Expense = require('../models/Expense');
const ExpenseType = require('../models/ExpenseType');

// Create new expense
const createExpense = async (req, res) => {
    try {
        const { expenseType, amount, description, paidTo, paymentMethod, approvedBy } = req.body;

        // Validate expense type exists
        const typeExists = await ExpenseType.findById(expenseType);
        if (!typeExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense type'
            });
        }

        const expense = new Expense({
            expenseType,
            amount,
            description,
            paidTo,
            paymentMethod,
            approvedBy
        });

        await expense.save();

        res.status(201).json({
            success: true,
            data: expense
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating expense',
            error: error.message
        });
    }
};

// Get all expenses with filters
const getExpenses = async (req, res) => {
    try {
        const { startDate, endDate, expenseType, paymentMethod } = req.query;

        const query = {};

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (expenseType) query.expenseType = expenseType;
        if (paymentMethod) query.paymentMethod = paymentMethod;

        const expenses = await Expense.find(query)
            .populate('expenseType', 'name')
            .populate('approvedBy', 'name')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching expenses',
            error: error.message
        });
    }
};

// Update expense
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.expenseType) {
            const typeExists = await ExpenseType.findById(updates.expenseType);
            if (!typeExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid expense type'
                });
            }
        }

        const expense = await Expense.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.status(200).json({
            success: true,
            data: expense
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating expense',
            error: error.message
        });
    }
};

// Delete expense
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const expense = await Expense.findByIdAndDelete(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting expense',
            error: error.message
        });
    }
};

module.exports = {
    createExpense,
    getExpenses,
    updateExpense,
    deleteExpense
};