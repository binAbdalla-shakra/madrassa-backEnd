// controllers/roleController.js
const Role = require('../models/Role');

// Create Role
exports.createRole = async (req, res) => {
    try {
        const role = await Role.create(req.body);
        res.status(201).json({data: role});
    } catch (error) { 
        res.status(400).json({ error: error.message });
    }
};

// Get All Roles
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find();
        res.json({ data: roles });  

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update Role
exports.updateRole = async (req, res) => {
    try {
        const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({data: role});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete Role
exports.deleteRole = async (req, res) => {
    try {
        await Role.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
