const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const feeTypeController = require('../controllers/feeTypeController');
const { validateFeeType, validateFeeGeneration, validatePayment } = require('../validators/feeValidators');

// Fee Type Routes
router.get('/fee-types/categories', feeTypeController.getFeeCategories);
router.post('/fee-types', [validateFeeType], feeTypeController.createFeeType);
router.get('/fee-types', feeTypeController.getAllFeeTypes);
router.get('/fee-types/:id', feeTypeController.getFeeTypeById);
router.put('/fee-types/:id', feeTypeController.updateFeeType);
router.patch('/fee-types/:id/deactivate', feeTypeController.deactivateFeeType);

// Fee Generation Routes
router.post('/fees/generate-monthly', feeController.generateMonthlyFees);
router.post('/fees/generate-custom', feeController.generateCustomFee);
router.post('/fees/bulk-generate', feeController.bulkGenerateFees);
router.post('/fees/:id/payment', feeController.recordPayment);
router.post('/fees/cancel', feeController.cancelFee);

// Fee Retrieval Routes
router.get('/fees/parent/:parentId', feeController.getParentFees);
router.get('/fees', feeController.getAllFees);
router.get('/fees/check-monthly', feeController.checkMonthlyFeesExist);

module.exports = router;