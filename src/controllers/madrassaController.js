const Madrassa = require('../models/madrassa');
const Branch = require('../models/Branch');


// Create madrassa
exports.createmadrassa = async (req, res) => {
    try {
        const madrassa = await Madrassa.create(req.body);
        res.status(201).json(madrassa);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get All Companies
exports.getmadrassa = async (req, res) => {
    try {
        const response = await Madrassa.find();
        res.json({data: response});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update madrassa
exports.updatemadrassa = async (req, res) => {
    try {
        const madrassa = await Madrassa.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(madrassa);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete madrassa
exports.deletemadrassa = async (req, res) => {
    try {
        // Check if there are branches associated with this madrassa
        const branchCount = await Branch.countDocuments({ madrassaId: req.params.id });
        
        if (branchCount > 0) {
            return res.status(400).json({ error: 'Cannot delete madrassa with existing branches' });
        }

        await Madrassa.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
