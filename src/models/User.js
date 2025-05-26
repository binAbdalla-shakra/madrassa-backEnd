// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, unique: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }, // Reference to Role collection
    createdAt: { type: Date, default: Date.now },
    CreatedBy: { type: String, required: true },
    ModifiedAt:  Date,
    ModifiedBy:  String,
});

module.exports = mongoose.model('User', userSchema);
