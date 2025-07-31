const mongoose = require('mongoose');

const menuPermissionSchema = new mongoose.Schema({
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
    subMenuIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Menu' }],
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String }
});

module.exports = mongoose.model('MenuPermission', menuPermissionSchema);