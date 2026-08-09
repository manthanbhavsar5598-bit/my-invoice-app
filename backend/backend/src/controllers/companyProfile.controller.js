const CompanyProfile = require('../models/CompanyProfile');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

exports.createProfile = catchAsync(async (req, res) => {
  const profile = await CompanyProfile.create({ ...req.body, owner: req.user.id });
  res.status(201).json({ success: true, data: { profile } });
});

exports.getProfiles = catchAsync(async (req, res) => {
  const profiles = await CompanyProfile.find({ owner: req.user.id }).sort('-createdAt');
  res.status(200).json({ success: true, results: profiles.length, data: { profiles } });
});

exports.updateProfile = catchAsync(async (req, res) => {
  const profile = await CompanyProfile.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, req.body, {
    new: true,
    runValidators: true
  });
  if (!profile) throw new ApiError(404, 'Company profile not found.');
  res.status(200).json({ success: true, data: { profile } });
});

exports.deleteProfile = catchAsync(async (req, res) => {
  const profile = await CompanyProfile.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!profile) throw new ApiError(404, 'Company profile not found.');
  res.status(204).json({ success: true, data: null });
});