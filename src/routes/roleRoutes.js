// routes/roleRoutes.js
const express = require('express');
const {
    createRole,
    getAllRoles,
    updateRole,
    deleteRole,
    assignPermissions,
} = require('../controllers/roleController');

const router = express.Router();

router.post('/', createRole);
router.get('/', getAllRoles);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

router.post('/:roleId/permissions', assignPermissions);


module.exports = router;
