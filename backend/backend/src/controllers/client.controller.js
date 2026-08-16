const Client = require('../models/Client');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

exports.createClient = catchAsync(async (req, res) => {
  const client = await Client.create({ ...req.body, owner: req.user.id });
  res.status(201).json({ success: true, data: { client } });
});

exports.getClients = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 2000);
  const skip = (page - 1) * limit;

  const filter = { owner: req.user.id };
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  const [clients, total] = await Promise.all([
    Client.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
    Client.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    results: clients.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: { clients }
  });
});

exports.getClient = catchAsync(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, owner: req.user.id });
  if (!client) throw new ApiError(404, 'Client not found.');
  res.status(200).json({ success: true, data: { client } });
});

exports.updateClient = catchAsync(async (req, res) => {
  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!client) throw new ApiError(404, 'Client not found.');
  res.status(200).json({ success: true, data: { client } });
});

exports.deleteClient = catchAsync(async (req, res) => {
  const client = await Client.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!client) throw new ApiError(404, 'Client not found.');
  res.status(204).json({ success: true, data: null });
});