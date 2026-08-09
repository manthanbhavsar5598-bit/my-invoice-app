const express = require('express');
const { body, param } = require('express-validator');
const recurringController = require('../controllers/recurring.controller');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(recurringController.getRecurring)
  .post(
    validate([
      body('client').isMongoId().withMessage('A valid client id is required'),
      body('lineItems').isArray({ min: 1 }).withMessage('At least one line item is required')
    ]),
    recurringController.createRecurring
  );

router
  .route('/:id')
  .patch(validate([param('id').isMongoId()]), recurringController.updateRecurring)
  .delete(validate([param('id').isMongoId()]), recurringController.deleteRecurring);

router.post('/:id/generate', validate([param('id').isMongoId()]), recurringController.generateInvoice);

module.exports = router;