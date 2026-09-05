const mongoose = require('mongoose');

const lotSchema = new mongoose.Schema(
  {
    lotNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stockEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockEntry',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    commodity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commodity',
      required: true,
    },
    chamber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chamber',
      required: true,
    },
    entryDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    originalQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    releasedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    storageRate: {
      type: Number,
      required: true,
    },
    rateType: {
      type: String,
      default: 'per_month',
    },
    status: {
      type: String,
      enum: ['Stored', 'Partially Released', 'Released'],
      default: 'Stored',
      index: true,
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
        // Calculate dynamic storage duration
        const now = new Date();
        const diffTime = Math.abs(now - new Date(ret.entryDate));
        ret.storageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        ret.storageMonths = Math.max(1, Math.ceil(ret.storageDays / 30));
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        const now = new Date();
        const diffTime = Math.abs(now - new Date(ret.entryDate));
        ret.storageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        ret.storageMonths = Math.max(1, Math.ceil(ret.storageDays / 30));
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Lot', lotSchema);
