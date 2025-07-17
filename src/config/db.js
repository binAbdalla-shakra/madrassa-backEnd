const mongoose = require('mongoose');
const config = require('./index');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(config.db.uri, config.db.options);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;

