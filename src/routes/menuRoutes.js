const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
// Create a menu item
router.post('/', menuController.createMenuItem
);

// Get all menu items (hierarchical)
router.get('/', menuController.getAllMenuItems);

// Get flat list of menu items (for admin)
router.get('/flat', menuController.getFlatMenuItems);

// Get single menu item
router.get('/:id', menuController.getMenuItem);

// Update a menu item
router.put('/:id', menuController.updateMenuItem
);

// Delete a menu item
router.delete('/:id', menuController.deleteMenuItem);

module.exports = router;