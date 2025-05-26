const Branch = require('../models/Branch');

// Create Branch
exports.createBranch = async (req, res) => {
    try {
        const branch = await Branch.create(req.body);
        res.status(201).json(branch);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get All Branches
exports.getAllBranches = async (req, res) => {
    try {
        const branches = await Branch.find().populate('madrassaId');
        res.json({data: branches});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update Branch
exports.updateBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(branch);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete Branch
exports.deleteBranch = async (req, res) => {
    try {
        await Branch.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
