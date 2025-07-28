// routes/roleRoutes.js
const express = require('express');
const {
    createPermission,
    getMenuStructure,
} = require('../controllers/permissionController');

const router = express.Router();

router.post('/', createPermission);
router.get('/menu', getMenuStructure);
// router.put('/:id', updateRole);
// router.delete('/:id', deleteRole);


module.exports = router;
