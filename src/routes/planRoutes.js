const express = require('express');
const {
    createPlan,
    getAllPlans,
    updatePlan,
    deletePlan,
} = require('../controllers/planController');

const router = express.Router();

router.post('/', createPlan);
router.get('/', getAllPlans);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
