const express = require('express');
const router = express.Router();
const roleMenuController = require('../controllers/roleMenuController');

router.get('/:roleId/menus', roleMenuController.getMenusForRole);
router.post('/:roleId/permissions', roleMenuController.updateRoleMenuPermissions);
router.get('/:roleId/permissions', roleMenuController.getRolePermissions);

module.exports = router;