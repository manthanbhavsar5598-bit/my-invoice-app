const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    company: {
      name: { type: String, trim: true, default: 'Your Business' },
      email: { type: String, trim: true },
      address: { type: String, trim: true },
      phone: { type: String, trim: true },
      logoUrl: { type: String, trim: true },
      gstNumber: { type: String, trim: true },
      currencySymbol: { type: String, trim: true, default: '₹' },
      taxRate: { type: Number, default: 0 },
      prefix: { type: String, trim: true, default: 'INV' },
      nextNumber: { type: Number, default: 1001 },
      bankName: { type: String, trim: true },
      branchName: { type: String, trim: true },
      accountNo: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      terms: { type: String, trim: true }
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    passwordChangedAt: Date
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtTimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return jwtTimestamp < changedTimestamp;
};

module.exports = mongoose.model('User', userSchema);