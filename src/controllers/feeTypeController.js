const FeeType = require('../models/FeeType');
const { validationResult } = require('express-validator');

exports.createFeeType = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const feeType = new FeeType({
            ...req.body
        });

        await feeType.save();
        
        res.status(201).json({
            success: true,
            data: feeType
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating fee type',
            error: error.message
        });
    }
};

exports.getAllFeeTypes = async (req, res) => {
    try {
        const { category, isActive } = req.query;
        const query = {};
        
        if (category) query.category = category;
        if (isActive) query.isActive = isActive === 'true';
        
        const feeTypes = await FeeType.find(query)
            .sort({ category: 1, name: 1 });
        
        res.status(200).json({
            success: true,
            count: feeTypes.length,
            data: feeTypes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching fee types',
            error: error.message
        });
    }
};

exports.getFeeTypeById = async (req, res) => {
    try {
        const feeType = await FeeType.findById(req.params.id);
        
        if (!feeType) {
            return res.status(404).json({
                success: false,
                message: 'Fee type not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: feeType
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching fee type',
            error: error.message
        });
    }
};

exports.updateFeeType = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const feeType = await FeeType.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body
            },
            { new: true, runValidators: true }
        );
        
        if (!feeType) {
            return res.status(404).json({
                success: false,
                message: 'Fee type not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: feeType
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating fee type',
            error: error.message
        });
    }
};

exports.deactivateFeeType = async (req, res) => {
    try {
        const feeType = await FeeType.findByIdAndUpdate(
            req.params.id,
            {
                isActive: false
            },
            { new: true }
        );
        
        if (!feeType) {
            return res.status(404).json({
                success: false,
                message: 'Fee type not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Fee type deactivated successfully',
            data: feeType
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deactivating fee type',
            error: error.message
        });
    }
};

exports.getFeeCategories = async (req, res) => {
    try {
        const categories = FeeType.schema.path('category').enumValues;
        
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching fee categories',
            error: error.message
        });
    }
};