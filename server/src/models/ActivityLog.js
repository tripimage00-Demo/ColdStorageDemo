const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['INWARD', 'RELEASE', 'PAYMENT', 'CUSTOMER', 'CHAMBER', 'ALERT'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    meta: {
      type: Object,
      default: {},
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
  }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
