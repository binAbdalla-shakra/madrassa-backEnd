const Customer = require('../models/Customers');

// Create a new customer
exports.createCustomer = async (req, res) => {
    try {
        const customerData = req.body;
        const customer = new Customer(customerData);

        await customer.save();
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().populate('createdBy', 'username email').populate('branchID'); // Populate creator details
        res.json(customers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get a single customer by ID
exports.getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findById(id).populate('createdBy', 'username email');
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedCustomer = await Customer.findByIdAndUpdate(id, updateData, { new: true }).populate('createdBy', 'username email');

        if (!updatedCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(updatedCustomer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCustomer = await Customer.findByIdAndDelete(id);

        if (!deletedCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.status(204).send(); // No content response
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
