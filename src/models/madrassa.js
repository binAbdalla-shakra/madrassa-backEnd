const mongoose = require('mongoose');

const madrassaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  contactNumber: String,
  Email: { type: String, unique: true },
  
  studentIdPrefix: String,
  currencyDigits: { type: Number, default: 2 },
  logo: String,       // store URL or base64
  header: String,     // store URL or base64

  createdAt: { type: Date, default: Date.now },
  CreatedBy: { type: String, required: true },
  ModifiedAt: Date,
  ModifiedBy: String,
});

module.exports = mongoose.model('madrassa', madrassaSchema);
