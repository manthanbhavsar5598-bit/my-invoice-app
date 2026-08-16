const Recurring = require('../models/Recurring');
const Invoice = require('../models/Invoice');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const addInterval = (date, freq) => {
  const d = new Date(date);
  if (freq === 'weekly') d.setDate(d.getDate() + 7);
  else if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (freq === 'quarterly') d.setMonth(d.getMonth() + 3);
  else if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d;
};

exports.createRecurring = catchAsync(async (req, res) => {
  const recurring = await Recurring.create({ ...req.body, owner: req.user.id });
  res.status(201).json({ success: true, data: { recurring } });
});

exports.getRecurring = catchAsync(async (req, res) => {
  const recurring = await Recurring.find({ owner: req.user.id }).sort('-createdAt').lean();
  res.status(200).json({ success: true, results: recurring.length, data: { recurring } });
});

exports.updateRecurring = catchAsync(async (req, res) => {
  const recurring = await Recurring.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, req.body, {
    new: true,
    runValidators: true
  });
  if (!recurring) throw new ApiError(404, 'Recurring template not found.');
  res.status(200).json({ success: true, data: { recurring } });
});

exports.deleteRecurring = catchAsync(async (req, res) => {
  const recurring = await Recurring.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!recurring) throw new ApiError(404, 'Recurring template not found.');
  res.status(204).json({ success: true, data: null });
});

// Generates a real invoice from a recurring template and advances the
// template's nextDate. The bill number is left blank for the user to fill
// in manually (no auto-increment). Since this is a backend-only flow with
// no frontend round trip, totals are computed once here, the same way the
// frontend's computeTotals() would for a plain (non-commission) invoice.
exports.generateInvoice = catchAsync(async (req, res) => {
  const recurring = await Recurring.findOne({ _id: req.params.id, owner: req.user.id });
  if (!recurring) throw new ApiError(404, 'Recurring template not found.');

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);

  const subtotal = recurring.lineItems.reduce((sum, li) => sum + (li.qty || 0) * (li.price || 0), 0);
  const taxAmount = (subtotal * (recurring.taxRate || 0)) / 100;
  const total = subtotal + taxAmount;

  const invoice = await Invoice.create({
    owner: req.user.id,
    client: recurring.client,
    number: '',
    items: recurring.lineItems,
    taxRate: recurring.taxRate,
    notes: recurring.notes,
    subtotal: +subtotal.toFixed(2),
    taxAmount: +taxAmount.toFixed(2),
    total: +total.toFixed(2),
    dueDate,
    status: 'draft'
  });

  recurring.nextDate = addInterval(recurring.nextDate, recurring.frequency);
  recurring.lastGenerated = new Date();
  await recurring.save();

  res.status(201).json({ success: true, data: { invoice, recurring } });
});