const mongoose = require('mongoose');

const ParkingSlotSchema = new mongoose.Schema(
  {
    parkingLotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: [true, 'Please associate this slot with a parking lot'],
    },
    slotNumber: {
      type: String,
      required: [true, 'Please add a slot number'],
      trim: true,
    },
    floor: {
      type: String,
      default: 'Ground',
      trim: true,
    },
    slotType: {
      type: String,
      required: [true, 'Please select a slot type'],
      enum: {
        values: ['motorcycle', 'compact', 'large', 'ev'],
        message: '{VALUE} is not a valid slot type (motorcycle, compact, large, ev)',
      },
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available',
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Please specify the hourly rate for this slot type'],
      min: [0, 'Hourly rate cannot be negative'],
    },
    distanceScore: {
      type: Number,
      default: 1,
      min: [1, 'Distance score must be at least 1 (closer is better)'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure slot number is unique within a single parking lot
ParkingSlotSchema.index({ parkingLotId: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSlot', ParkingSlotSchema);
