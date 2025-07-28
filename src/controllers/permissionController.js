const Permission = require('../models/permission');

exports.createPermission = async (req, res) => {
    try {
        const permission = new Permission({
            ...req.body
        });
        await permission.save();
        res.status(201).json(permission);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getMenuStructure = async (req, res) => {
    try {
        const permissions = await Permission.find({ isMenuItem: true });
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};