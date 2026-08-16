const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Item name is required'], trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 500 },
    hsnCode: { type: String, trim: true },
    unit: { type: String, trim: true },
    price: { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
);

// Covers the getItems list query (find by owner, sort by -createdAt).
itemSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Item', itemSchema);