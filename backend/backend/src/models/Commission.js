const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: [true, 'Date is required'] },
    fromCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: [true, 'From company is required'] },
    toCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: [true, 'To company is required'] },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: [true, 'Item is required'] },
    quantity: { type: Number, required: [true, 'Quantity is required'], min: 0 },
    rate: { type: Number, required: [true, 'Rate is required'], min: 0 },
  },
  { timestamps: true }
);

commissionSchema.index({ owner: 1, date: -1 });

commissionSchema.pre('validate', function computeAmount(next) {
  this.amount = (Number(this.quantity) || 0) * (Number(this.rate) || 0);
  next();
});

module.exports = mongoose.model('Commission', commissionSchema);