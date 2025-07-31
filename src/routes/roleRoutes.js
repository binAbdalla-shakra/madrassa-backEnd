// routes/roleRoutes.js
const express = require('express');
const {
    createRole,
    getAllRoles,
    updateRole,
    deleteRole,
    assignPermissionsToRole,
    getRolePermissions,
} = require('../controllers/roleController');

const router = express.Router();

router.post('/', createRole);
router.get('/', getAllRoles);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

// getPermissionsForAssignment

module.exports = router;
