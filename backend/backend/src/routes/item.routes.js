const express = require('express');
const { body, param } = require('express-validator');
const itemController = require('../controllers/item.controller');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(itemController.getItems)
  .post(validate([body('name').trim().notEmpty().withMessage('Item name is required')]), itemController.createItem);

router
  .route('/:id')
  .patch(validate([param('id').isMongoId()]), itemController.updateItem)
  .delete(validate([param('id').isMongoId()]), itemController.deleteItem);

module.exports = router;