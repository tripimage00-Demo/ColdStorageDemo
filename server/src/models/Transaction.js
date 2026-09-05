const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['Storage Charge', 'Stock Release', 'Payment', 'Adjustment'],
      required: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
