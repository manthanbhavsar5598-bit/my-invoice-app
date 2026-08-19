const mongoose = require('mongoose');

// CompanyProfile is fully independent from User. A user (owner) can have
// many company profiles; there is no "primary" concept — the correct
// profile is always chosen explicitly (e.g. on the Invoice Form).
const companyProfileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Business name is required'], trim: true, maxlength: 150 },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    invoicePrefix: { type: String, trim: true },
    currencySymbol: { type: String, trim: true, default: '₹' },
    bankName: { type: String, trim: true },
    branchName: { type: String, trim: true },
    accountNo: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    terms: { type: String, trim: true }
  },
  { timestamps: true }
);

// Covers the getProfiles list query (find by owner, sort by -createdAt).
companyProfileSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);