const mongoose = require('mongoose');

const purchaseInvoiceSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile', default: null },
    date: { type: Date, required: [true, 'Date is required'] },
    billNo: { type: String, required: [true, 'Bill No. is required'], trim: true, maxlength: 100 },
    billFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: [true, 'Bill From client is required'] },
    hsnCode: { type: String, trim: true },
    weight: { type: Number, min: 0, default: 0 },
    amount: { type: Number, min: 0, default: 0 },
    igst: { type: Number, min: 0, default: 0 },
    cgst: { type: Number, min: 0, default: 0 },
    sgst: { type: Number, min: 0, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 }
  },
  { timestamps: true }
);

purchaseInvoiceSchema.index({ owner: 1, date: -1 });

purchaseInvoiceSchema.pre('validate', function computeGrandTotal(next) {
  this.grandTotal =
    (Number(this.amount) || 0) +
    (Number(this.igst) || 0) +
    (Number(this.cgst) || 0) +
    (Number(this.sgst) || 0) +
    (Number(this.roundOff) || 0);
  next();
});

module.exports = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);