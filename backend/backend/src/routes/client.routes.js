const express = require('express');
const { body, param } = require('express-validator');
const clientController = require('../controllers/client.controller');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(clientController.getClients)
  .post(
    validate([
      body('name').trim().notEmpty().withMessage('Client name is required'),
      body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email required')
    ]),
    clientController.createClient
  );

router
  .route('/:id')
  .get(validate([param('id').isMongoId()]), clientController.getClient)
  .patch(
    validate([
      param('id').isMongoId(),
      body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email required')
    ]),
    clientController.updateClient
  )
  .delete(validate([param('id').isMongoId()]), clientController.deleteClient);

module.exports = router;
