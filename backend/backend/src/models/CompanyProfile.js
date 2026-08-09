const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Business name is required'], trim: true, maxlength: 150 },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    prefix: { type: String, trim: true, default: 'INV' },
    nextNumber: { type: Number, default: 1001 },
    bankName: { type: String, trim: true },
    branchName: { type: String, trim: true },
    accountNo: { type: String, trim: true },
    ifscCode: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);