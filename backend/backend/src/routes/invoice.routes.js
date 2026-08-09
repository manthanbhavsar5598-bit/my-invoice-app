const express = require('express');
const { body, param } = require('express-validator');
const invoiceController = require('../controllers/invoice.controller');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

const invoiceBodyValidation = [
  body('client').isMongoId().withMessage('A valid client id is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('dueDate').isISO8601().toDate().withMessage('A valid due date is required'),
  body('taxRate').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
];

router
  .route('/')
  .get(invoiceController.getInvoices)
  .post(validate(invoiceBodyValidation), invoiceController.createInvoice);

router
  .route('/:id')
  .get(validate([param('id').isMongoId()]), invoiceController.getInvoice)
  .patch(validate([param('id').isMongoId()]), invoiceController.updateInvoice)
  .delete(validate([param('id').isMongoId()]), invoiceController.deleteInvoice);

router.get('/:id/pdf', validate([param('id').isMongoId()]), invoiceController.downloadInvoicePDF);
router.post('/:id/send', validate([param('id').isMongoId()]), invoiceController.emailInvoice);

module.exports = router;