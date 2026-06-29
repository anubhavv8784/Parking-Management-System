const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    parkingLotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: true,
    },
    parkingSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Please provide the vehicle license plate number'],
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      required: [true, 'Please specify the vehicle type'],
      enum: ['motorcycle', 'compact', 'large', 'ev'],
    },
    checkInTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    checkOutTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
    totalFee: {
      type: Number,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups during check-out and reporting
TicketSchema.index({ vehicleNumber: 1, status: 1 });

module.exports = mongoose.model('Ticket', TicketSchema);
