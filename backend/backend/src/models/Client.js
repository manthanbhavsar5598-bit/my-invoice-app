const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Client name is required'], trim: true, maxlength: 150 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    stateCode: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

clientSchema.index({ owner: 1, name: 1 });

module.exports = mongoose.model('Client', clientSchema);