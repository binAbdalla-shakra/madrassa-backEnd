// models/Role.js
const mongoose = require('mongoose');

// Define the role schema
const roleSchema = new mongoose.Schema({
    type: { type: String, required: true }, // Role type (e.g., Admin, User)
    description: { type: String }, // Description of the role
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],

    madrassaId: { type: mongoose.Schema.Types.ObjectId, ref: 'madrassa', required: true },
    createdAt: { type: Date, default: Date.now }, // Timestamp for creation date
    CreatedBy: { type: String, required: true },
    ModifiedAt: Date,
    ModifiedBy: String,
});

// Export the Role model
module.exports = mongoose.model('Role', roleSchema);
