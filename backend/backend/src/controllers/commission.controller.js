const Commission = require('../models/Commission');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

exports.createCommission = catchAsync(async (req, res) => {
  const commission = await Commission.create({ ...req.body, owner: req.user.id });
  await commission.populate(['fromCompany', 'toCompany', 'item']);
  res.status(201).json({ success: true, data: { commission } });
});

exports.getCommissions = catchAsync(async (req, res) => {
  const filter = { owner: req.user.id };

  if (req.query.fromCompany) filter.fromCompany = req.query.fromCompany;
  if (req.query.toCompany) filter.toCompany = req.query.toCompany;

  if (req.query.fromDate || req.query.toDate) {
    filter.date = {};
    if (req.query.fromDate) filter.date.$gte = new Date(req.query.fromDate);
    if (req.query.toDate) filter.date.$lte = new Date(req.query.toDate);
  }

  const commissions = await Commission.find(filter)
    .populate(['fromCompany', 'toCompany', 'item'])
    .sort('-date -createdAt')
    .lean();

  res.status(200).json({ success: true, results: commissions.length, data: { commissions } });
});

exports.updateCommission = catchAsync(async (req, res) => {
  const commission = await Commission.findOne({ _id: req.params.id, owner: req.user.id });
  if (!commission) throw new ApiError(404, 'Commission entry not found.');
  Object.assign(commission, req.body);
  await commission.save();
  await commission.populate(['fromCompany', 'toCompany', 'item']);
  res.status(200).json({ success: true, data: { commission } });
});

exports.deleteCommission = catchAsync(async (req, res) => {
  const commission = await Commission.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!commission) throw new ApiError(404, 'Commission entry not found.');
  res.status(204).json({ success: true, data: null });
});