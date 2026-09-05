const mongoose = require('mongoose');

const stockReleaseSchema = new mongoose.Schema(
  {
    releaseNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    releaseDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    lot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lot',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    chamber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chamber',
      required: true,
    },
    commodity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commodity',
      required: true,
    },
    availableQuantity: {
      type: Number,
      required: true,
    },
    releaseQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    storageDays: {
      type: Number,
      default: 0,
    },
    storageMonths: {
      type: Number,
      default: 1,
    },
    calculatedCharges: {
      type: Number,
      required: true,
      min: 0,
    },
    actualCharges: {
      type: Number,
      required: true,
      min: 0,
    },
    previousBalance: {
      type: Number,
      default: 0,
    },
    paymentReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingBalance: {
      type: Number,
      default: 0,
    },
    vehicleNumber: {
      type: String,
      default: '',
      trim: true,
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

module.exports = mongoose.model('StockRelease', stockReleaseSchema);
