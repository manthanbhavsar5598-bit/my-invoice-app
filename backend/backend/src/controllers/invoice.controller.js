const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const generateInvoicePDF = require('../utils/generateInvoicePDF');
const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger');

// Bill-creation notifications always go to these two fixed addresses,
// regardless of who the invoice's client is.
const BILL_NOTIFY_EMAILS = ['manthanbhavsar5598@gmail.com', 'nchem95@gmail.com'];

const notifyBillCreated = async (invoice, client, owner, companyProfile) => {
  // Respect the Settings > "send email on invoice created" toggle at all times.
  if (!owner?.settings?.sendEmailOnInvoiceCreate) return;
  try {
    const pdfBuffer = await generateInvoicePDF(invoice, client, companyProfile);
    await sendEmail({
      to: BILL_NOTIFY_EMAILS.join(','),
      subject: `New invoice created: ${invoice.number || invoice._id}`,
      text: `A new invoice ${invoice.number || ''} was created for ${client?.name || 'a client'}. Total: ${invoice.total}.`,
      attachments: [{ filename: `${invoice.number || invoice._id}.pdf`, content: pdfBuffer }]
    });
  } catch (err) {
    logger.error(`Failed to send bill-creation notification: ${err.message}`);
  }
};

exports.createInvoice = catchAsync(async (req, res) => {
  const client = await Client.findOne({ _id: req.body.client, owner: req.user.id });
  if (!client) throw new ApiError(404, 'Client not found.');

  let companyProfile = null;
  if (req.body.companyProfile) {
    companyProfile = await CompanyProfile.findOne({ _id: req.body.companyProfile, owner: req.user.id });
    if (!companyProfile) throw new ApiError(404, 'Company profile not found.');
  }

  // Bill number is entered manually by the user — no generation, no
  // uniqueness/format validation, no counter to bump.
  const invoice = await Invoice.create({
    ...req.body,
    owner: req.user.id
  });

  const owner = await User.findById(req.user.id);
  notifyBillCreated(invoice, client, owner, companyProfile); // fire-and-forget, doesn't block the response

  res.status(201).json({ success: true, data: { invoice } });
});

exports.getInvoices = catchAsync(async (req, res) => {
  const filter = { owner: req.user.id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.client) filter.client = req.query.client;

  const invoices = await Invoice.find(filter).sort('-createdAt').lean();
  res.status(200).json({ success: true, results: invoices.length, data: { invoices } });
});

exports.getInvoice = catchAsync(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user.id }).populate('client');
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  res.status(200).json({ success: true, data: { invoice } });
});

exports.updateInvoice = catchAsync(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user.id });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');

  Object.assign(invoice, req.body);
  if (req.body.status === 'paid' && !invoice.paidDate) invoice.paidDate = new Date();
  await invoice.save(); // no total recalculation happens here — totals come from the frontend as-is

  res.status(200).json({ success: true, data: { invoice } });
});

exports.deleteInvoice = catchAsync(async (req, res) => {
  const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  res.status(204).json({ success: true, data: null });
});

exports.downloadInvoicePDF = catchAsync(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user.id }).populate('client');
  if (!invoice) throw new ApiError(404, 'Invoice not found.');

  const companyProfile = invoice.companyProfile
    ? await CompanyProfile.findOne({ _id: invoice.companyProfile, owner: req.user.id })
    : null;

  const pdfBuffer = await generateInvoicePDF(invoice, invoice.client, companyProfile);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=${invoice.number || invoice._id}.pdf`,
    'Content-Length': pdfBuffer.length
  });
  res.send(pdfBuffer);
});

exports.emailInvoice = catchAsync(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user.id }).populate('client');
  if (!invoice) throw new ApiError(404, 'Invoice not found.');

  // Respect the Settings > "send email on invoice created" toggle at all times.
  if (!req.user?.settings?.sendEmailOnInvoiceCreate) {
    return res.status(200).json({ success: true, message: 'Email notifications are disabled in settings.', data: { invoice } });
  }

  const companyProfile = invoice.companyProfile
    ? await CompanyProfile.findOne({ _id: invoice.companyProfile, owner: req.user.id })
    : null;

  const pdfBuffer = await generateInvoicePDF(invoice, invoice.client, companyProfile);

  await sendEmail({
    to: BILL_NOTIFY_EMAILS.join(','),
    subject: `Invoice ${invoice.number || invoice._id} from ${companyProfile?.name || req.user.name || 'your business'}`,
    text: `Invoice ${invoice.number || ''} for ${invoice.client?.name || 'client'}, total ${invoice.total}.`,
    attachments: [{ filename: `${invoice.number || invoice._id}.pdf`, content: pdfBuffer }]
  });

  if (invoice.status === 'draft') {
    invoice.status = 'sent';
    await invoice.save();
  }

  res.status(200).json({ success: true, message: 'Invoice emailed.', data: { invoice } });
});