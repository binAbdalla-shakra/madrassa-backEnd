const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// POST /api/expenses - Create new expense
router.post('/', expenseController.createExpense);

// GET /api/expenses - Get all expenses
router.get('/', expenseController.getExpenses);

// PUT /api/expenses/:id - Update expense
router.put('/:id', expenseController.updateExpense);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;