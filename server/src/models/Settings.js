const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'SmartCold Storage Management',
    },
    tagline: {
      type: String,
      default: 'Simple Storage. Better Control.',
    },
    ownerName: {
      type: String,
      default: 'Rajesh Agarwal',
    },
    address: {
      type: String,
      default: 'NH-19 Agra Highway Bypass, Sikandra, Agra, Uttar Pradesh - 282007',
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    email: {
      type: String,
      default: 'contact@smartcold.com',
    },
    gstNumber: {
      type: String,
      default: '09AAACS1234F1Z5',
    },
    defaultStorageRate: {
      type: Number,
      default: 20,
    },
    currency: {
      type: String,
      default: '₹',
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

module.exports = mongoose.model('Settings', settingsSchema);
