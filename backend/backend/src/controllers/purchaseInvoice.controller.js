const PurchaseInvoice = require('../models/PurchaseInvoice');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

exports.createPurchaseInvoice = catchAsync(async (req, res) => {
  const invoice = await PurchaseInvoice.create({ ...req.body, owner: req.user.id });
  await invoice.populate('billFrom');
  res.status(201).json({ success: true, data: { purchaseInvoice: invoice } });
});

exports.getPurchaseInvoices = catchAsync(async (req, res) => {
  const invoices = await PurchaseInvoice.find({ owner: req.user.id })
    .populate('billFrom')
    .sort('-date -createdAt')
    .lean();
  res.status(200).json({ success: true, results: invoices.length, data: { purchaseInvoices: invoices } });
});

exports.updatePurchaseInvoice = catchAsync(async (req, res) => {
  let invoice = await PurchaseInvoice.findOne({ _id: req.params.id, owner: req.user.id });
  if (!invoice) throw new ApiError(404, 'Purchase invoice not found.');
  Object.assign(invoice, req.body);
  await invoice.save();
  await invoice.populate('billFrom');
  res.status(200).json({ success: true, data: { purchaseInvoice: invoice } });
});

exports.deletePurchaseInvoice = catchAsync(async (req, res) => {
  const invoice = await PurchaseInvoice.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!invoice) throw new ApiError(404, 'Purchase invoice not found.');
  res.status(204).json({ success: true, data: null });
});