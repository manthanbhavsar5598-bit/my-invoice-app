const Item = require('../models/Item');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

exports.createItem = catchAsync(async (req, res) => {
  const item = await Item.create({ ...req.body, owner: req.user.id });
  res.status(201).json({ success: true, data: { item } });
});

exports.getItems = catchAsync(async (req, res) => {
  const items = await Item.find({ owner: req.user.id }).sort('-createdAt');
  res.status(200).json({ success: true, results: items.length, data: { items } });
});

exports.updateItem = catchAsync(async (req, res) => {
  const item = await Item.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, req.body, {
    new: true,
    runValidators: true
  });
  if (!item) throw new ApiError(404, 'Item not found.');
  res.status(200).json({ success: true, data: { item } });
});

exports.deleteItem = catchAsync(async (req, res) => {
  const item = await Item.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!item) throw new ApiError(404, 'Item not found.');
  res.status(204).json({ success: true, data: null });
});