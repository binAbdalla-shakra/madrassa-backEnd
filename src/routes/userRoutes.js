const express = require('express');
const {
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
} = require('../controllers/userController');

const router = express.Router();

// User routes
router.post('/', createUser); // Create a new user
router.get('/', getAllUsers); // Get all users
router.put('/:id', updateUser); // Update a user by ID
router.delete('/:id', deleteUser); // Delete a user by ID

module.exports = router;
