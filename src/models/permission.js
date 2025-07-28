const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g. "view_dashboard"
    label: { type: String, required: true }, // Display name e.g. "Dashboard"
    icon: { type: String }, // e.g. "ri-dashboard-line"
    path: { type: String }, // Main path (for parent items)
    category: { type: String }, // Grouping category
    isMenuItem: { type: Boolean, default: true },
    subItems: [{
        label: String,
        path: { type: String, required: true },
        permissionName: String
    }],
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String }
});

module.exports = mongoose.model('Permission', permissionSchema);