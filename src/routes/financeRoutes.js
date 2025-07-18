const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const receiptController = require('../controllers/receiptController');
const reportController = require('../controllers/reportController');

// Fee generation routes
router.post('/fees/generate-monthly', feeController.generateMonthlyFees);
router.get('/parents/:parentId/fees', feeController.getParentFees);

// router.get('/fees', feeController.getGeneratedFees);
// router.get('/parents/active', feeController.getParentsWithActiveStudents);
// router.get('/fees/exists', feeController.checkFeesExist);
// router.get('/fees/parent/:parentId', feeController.getPendingFeesForParent);

// Receipt routes
router.post('/parents/:parentId/receipts', receiptController.createReceipt);
router.get('/parents/:parentId/receipts', receiptController.getParentReceipts);

// // Report routes
router.get('/parents/:parentId/reports/monthly', reportController.getParentMonthlyReport);


// // Finance report routes
router.get('/expenses', reportController.getExpenseReport);
router.get('/summary', reportController.getFinanceSummary);
router.get('/details', reportController.getFinanceDetails);

module.exports = router;