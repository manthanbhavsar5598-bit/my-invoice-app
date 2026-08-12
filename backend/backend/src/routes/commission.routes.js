const express = require('express');
const { body, param } = require('express-validator');
const commissionController = require('../controllers/commission.controller');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

const createValidation = [
  body('date').notEmpty().withMessage('Date is required'),
  body('fromCompany').isMongoId().withMessage('From company is required'),
  body('toCompany').isMongoId().withMessage('To company is required'),
  body('item').isMongoId().withMessage('Item is required'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('rate').isFloat({ min: 0 }).withMessage('Rate must be a positive number')
];

router
  .route('/')
  .get(commissionController.getCommissions)
  .post(validate(createValidation), commissionController.createCommission);

router
  .route('/:id')
  .patch(validate([param('id').isMongoId()]), commissionController.updateCommission)
  .delete(validate([param('id').isMongoId()]), commissionController.deleteCommission);

module.exports = router;