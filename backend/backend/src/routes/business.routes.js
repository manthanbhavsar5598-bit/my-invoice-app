const express = require('express');
const businessController = require('../controllers/business.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router.route('/').get(businessController.getBusiness).put(businessController.updateBusiness);

module.exports = router;