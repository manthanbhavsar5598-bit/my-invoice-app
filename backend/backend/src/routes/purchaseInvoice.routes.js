const express = require('express');
const { body, param } = require('express-validator');
const purchaseInvoiceController = require('../controllers/purchaseInvoice.controller');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

const createValidation = [
  body('billNo').trim().notEmpty().withMessage('Bill No. is required'),
  body('billFrom').isMongoId().withMessage('Bill From client is required'),
  body('date').notEmpty().withMessage('Date is required')
];

router
  .route('/')
  .get(purchaseInvoiceController.getPurchaseInvoices)
  .post(validate(createValidation), purchaseInvoiceController.createPurchaseInvoice);

router
  .route('/:id')
  .patch(validate([param('id').isMongoId()]), purchaseInvoiceController.updatePurchaseInvoice)
  .delete(validate([param('id').isMongoId()]), purchaseInvoiceController.deletePurchaseInvoice);

module.exports = router;