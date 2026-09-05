const mongoose = require('mongoose');

const chamberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    chamberCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    maxCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    temperature: {
      type: Number,
      default: 2.0, // Celsius
    },
    status: {
      type: String,
      enum: ['Active', 'Full', 'Maintenance', 'Inactive'],
      default: 'Active',
    },
    description: {
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
        ret.availableCapacity = Math.max(0, ret.maxCapacity - ret.currentOccupancy);
        ret.occupancyPercentage = ret.maxCapacity > 0 ? Math.round((ret.currentOccupancy / ret.maxCapacity) * 1000) / 10 : 0;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.availableCapacity = Math.max(0, ret.maxCapacity - ret.currentOccupancy);
        ret.occupancyPercentage = ret.maxCapacity > 0 ? Math.round((ret.currentOccupancy / ret.maxCapacity) * 1000) / 10 : 0;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Chamber', chamberSchema);
