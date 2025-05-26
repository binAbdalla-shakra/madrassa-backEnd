const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true },
    emergencyContact: { type: String, required: true },
    dateOfBirth: { type: Date },
    status: { type: String, required: true },
    IsFree: { type: String, default: 'NO', required: true },
    sex: {type:String,required:true},
    JoinDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to admin or creator
    branchID: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // Reference to branch
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', CustomerSchema);
