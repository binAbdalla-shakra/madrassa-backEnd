const express = require('express');
const router = express.Router();
const expenseTypeController = require('../controllers/expenseTypeController');

// Expense Type routes
router.post('/', expenseTypeController.createExpenseType);
router.get('/', expenseTypeController.getExpenseTypes);
router.get('/:id', expenseTypeController.getExpenseType);
router.put('/:id', expenseTypeController.updateExpenseType);
router.delete('/:id', expenseTypeController.deleteExpenseType);

module.exports = router;