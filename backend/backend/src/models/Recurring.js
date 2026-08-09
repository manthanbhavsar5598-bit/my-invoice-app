const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    id: { type: String },
    description: { type: String, trim: true, maxlength: 300 },
    qty: { type: Number, default: 1 },
    price: { type: Number, default: 0 }
  },
  { _id: false }
);

const recurringSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    frequency: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], default: 'monthly' },
    nextDate: { type: Date, required: true },
    lastGenerated: { type: Date, default: null },
    active: { type: Boolean, default: true },
    taxRate: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
    lineItems: {
      type: [lineItemSchema],
      validate: [(arr) => arr.length > 0, 'A recurring template must have at least one line item']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recurring', recurringSchema);