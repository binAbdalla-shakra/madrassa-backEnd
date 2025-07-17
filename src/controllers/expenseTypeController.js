const ExpenseType = require('../models/ExpenseType');
const mongoose = require('mongoose');

// Create new expense type
exports.createExpenseType = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validate input
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Expense type name is required'
            });
        }

        // Check if expense type already exists
        const existingType = await ExpenseType.findOne({ name });
        if (existingType) {
            return res.status(400).json({
                success: false,
                message: 'Expense type with this name already exists'
            });
        }

        const expenseType = new ExpenseType({
            name,
            description
        });

        await expenseType.save();

        res.status(201).json({
            success: true,
            data: expenseType
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating expense type',
            error: error.message
        });
    }
};

// Get all expense types
exports.getExpenseTypes = async (req, res) => {
    try {
        const { activeOnly } = req.query;

        const query = {};
        if (activeOnly === 'true') {
            query.isActive = true;
        }

        const expenseTypes = await ExpenseType.find(query).sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: expenseTypes.length,
            data: expenseTypes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching expense types',
            error: error.message
        });
    }
};

// Get single expense type
exports.getExpenseType = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense type ID'
            });
        }

        const expenseType = await ExpenseType.findById(id);

        if (!expenseType) {
            return res.status(404).json({
                success: false,
                message: 'Expense type not found'
            });
        }

        res.status(200).json({
            success: true,
            data: expenseType
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching expense type',
            error: error.message
        });
    }
};

// Update expense type
exports.updateExpenseType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense type ID'
            });
        }

        // Check if name is being updated to an existing name
        if (name) {
            const existingType = await ExpenseType.findOne({
                name,
                _id: { $ne: id }
            });

            if (existingType) {
                return res.status(400).json({
                    success: false,
                    message: 'Expense type with this name already exists'
                });
            }
        }

        const updates = {};
        if (name) updates.name = name;
        if (description) updates.description = description;
        if (typeof isActive === 'boolean') updates.isActive = isActive;

        const expenseType = await ExpenseType.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!expenseType) {
            return res.status(404).json({
                success: false,
                message: 'Expense type not found'
            });
        }

        res.status(200).json({
            success: true,
            data: expenseType
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating expense type',
            error: error.message
        });
    }
};

// Delete expense type (soft delete)
exports.deleteExpenseType = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense type ID'
            });
        }

        // Check if this type is used in any expenses
        const expenseCount = await Expense.countDocuments({ expenseType: id });
        if (expenseCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete expense type that is in use'
            });
        }

        const expenseType = await ExpenseType.findByIdAndDelete(id);

        if (!expenseType) {
            return res.status(404).json({
                success: false,
                message: 'Expense type not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting expense type',
            error: error.message
        });
    }
};