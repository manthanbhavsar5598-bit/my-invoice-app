const express = require('express');
const { body, param } = require('express-validator');
const profileController = require('../controllers/companyProfile.controller');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(profileController.getProfiles)
  .post(validate([body('name').trim().notEmpty().withMessage('Business name is required')]), profileController.createProfile);

router
  .route('/:id')
  .patch(validate([param('id').isMongoId()]), profileController.updateProfile)
  .delete(validate([param('id').isMongoId()]), profileController.deleteProfile);

module.exports = router;