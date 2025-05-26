const express = require('express');
const {
    createBranch,
    getAllBranches,
    updateBranch,
    deleteBranch,
} = require('../controllers/branchController');

const router = express.Router();

router.post('/', createBranch);
router.get('/', getAllBranches);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

module.exports = router;
