const mongoose = require('mongoose');

const commoditySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    storageRate: {
      type: Number,
      required: true,
      min: 0,
    },
    rateType: {
      type: String,
      enum: ['per_packet', 'per_bag', 'per_month', 'per_day', 'per_season'],
      default: 'per_month',
    },
    unit: {
      type: String,
      enum: ['Packet', 'Bag', 'Crate', 'Box', 'Kg', 'Quintal', 'Ton'],
      default: 'Bag',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
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

module.exports = mongoose.model('Commodity', commoditySchema);
