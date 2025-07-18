const { check } = require('express-validator');

exports.validateFeeType = [
    check('name', 'Name is required').not().isEmpty(),
    check('category', 'Valid category is required').isIn([
        'tuition', 'admission', 'graduation', 'exam', 'activity', 'transport', 'other'
    ]),
    check('amount', 'Amount must be a positive number').isFloat({ min: 0 }),
    check('isRecurring', 'isRecurring must be a boolean').optional().isBoolean(),
    check('frequency', 'Frequency must be one of: monthly, quarterly, yearly, one-time')
        .optional()
        .isIn(['monthly', 'quarterly', 'yearly', 'one-time', null]),
    check('appliesTo', 'appliesTo must be one of: all, active, new, graduating, specific')
        .optional()
        .isIn(['all', 'active', 'new', 'graduating', 'specific'])
];

exports.validateFeeGeneration = [
    check('feeTypeId', 'Fee Type ID is required').not().isEmpty(),
    check('parentId', 'Parent ID is required').not().isEmpty(),
    check('studentCount', 'Student count must be at least 1').isInt({ min: 1 }),
    check('totalAmount', 'Total amount must be a positive number').isFloat({ min: 0 }),
    check('discountAmount', 'Discount amount must be a positive number').optional().isFloat({ min: 0 }),
    check('dueDate', 'Valid due date is required').isISO8601()
];

exports.validatePayment = [
    check('amount', 'Payment amount must be a positive number').isFloat({ min: 0.01 }),
    check('feeId', 'Fee ID is required').not().isEmpty()
];