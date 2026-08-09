const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    id: { type: String }, // client-generated id, kept so the frontend can key/edit rows
    description: { type: String, trim: true, maxlength: 300 },
    hsnCode: { type: String, trim: true },
    qty: { type: Number, default: 0 },
    unit: { type: String, trim: true },
    price: { type: Number, default: 0 },
    // Commission-invoice specific fields
    date: { type: String, trim: true },
    partyName: { type: String, trim: true },
    weight: { type: Number, default: 0 },
    commission: { type: Number, default: 0 }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    companyProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile', default: null },
    number: { type: String, required: true },
    billType: { type: String, default: 'Invoice' },
    stateType: { type: String, default: '' },
    items: {
      type: [lineItemSchema],
      validate: [(arr) => arr.length > 0, 'An invoice must have at least one item']
    },
    taxRate: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
    transportName: { type: String, trim: true },
    vehicleNo: { type: String, trim: true },
    shipDispatchType: { type: String, trim: true },
    shipDispatchName: { type: String, trim: true },
    shipDispatchAddress: { type: String, trim: true },
    shipDispatchGst: { type: String, trim: true },
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft'
    },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date, default: null }
  },
  { timestamps: true }
);

invoiceSchema.index({ owner: 1, number: 1 }, { unique: true });
invoiceSchema.index({ owner: 1, status: 1 });
invoiceSchema.index({ owner: 1, client: 1 });

// Recalculate totals server-side on every save so the client can never
// forge amounts by sending a manipulated total. Commission invoices are
// billed on weight * commission-rate rather than qty * price.
invoiceSchema.pre('save', function calculateTotals(next) {
  const isCommission = this.billType === 'Commission Invoice';
  const subtotal = this.items.reduce((sum, item) => {
    if (isCommission) return sum + (item.weight || 0) * (item.commission || 0);
    return sum + (item.qty || 0) * (item.price || 0);
  }, 0);
  const taxAmount = (subtotal * (this.taxRate || 0)) / 100;
  const total = subtotal + taxAmount;

  this.subtotal = +subtotal.toFixed(2);
  this.taxAmount = +taxAmount.toFixed(2);
  this.total = +Math.max(total, 0).toFixed(2);
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);