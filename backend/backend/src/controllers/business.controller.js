const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

exports.getBusiness = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { business: req.user.company } });
});

exports.updateBusiness = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { company: req.body } },
    { new: true, runValidators: true }
  );
  res.status(200).json({ success: true, data: { business: user.company } });
});