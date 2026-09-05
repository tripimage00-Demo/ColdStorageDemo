const mongoose = require('mongoose');

const stockEntrySchema = new mongoose.Schema(
  {
    entryNumber: {
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
    lotNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    weightPerPacket: {
      type: Number,
      default: 50, // kg
    },
    totalWeight: {
      type: Number,
      default: 0,
    },
    storageRate: {
      type: Number,
      required: true,
    },
    rateType: {
      type: String,
      default: 'per_month',
    },
    vehicleNumber: {
      type: String,
      default: '',
      trim: true,
    },
    driverName: {
      type: String,
      default: '',
      trim: true,
    },
    qualityGrade: {
      type: String,
      default: 'Grade A',
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

module.exports = mongoose.model('StockEntry', stockEntrySchema);
