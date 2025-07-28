const express = require('express');
const {
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
    signin,
    getUserMenu

} = require('../controllers/userController');

const router = express.Router();

// User routes
router.post('/', createUser); // Create a new user
router.get('/', getAllUsers); // Get all users
router.put('/:id', updateUser); // Update a user by ID
router.delete('/:id', deleteUser); // Delete a user by ID
router.post('/signin', signin); // SignIn

// router.post('/:userId/permissions/additional', createUser); 


router.get('/:userId/menu', getUserMenu);

module.exports = router;
