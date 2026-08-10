const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User is intentionally independent from CompanyProfile. It only owns
// login/auth concerns and app-level settings — no company/business data.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },

    // App-level settings/preferences (not company data).
    settings: {
      // Controls whether an email goes out automatically when a bill/invoice is created.
      sendEmailOnInvoiceCreate: { type: Boolean, default: true },
      currencySymbol: { type: String, trim: true, default: '₹' }
    },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    passwordChangedAt: Date,

    // --- Password reset (PIN-based, no current password required) ---
    resetPinHash: { type: String, select: false },
    resetPinExpires: { type: Date, select: false }
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