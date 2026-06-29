const mongoose = require('mongoose');

const ParkingLotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name for the parking lot'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to get all slots associated with this lot
ParkingLotSchema.virtual('slots', {
  ref: 'ParkingSlot',
  localField: '_id',
  foreignField: 'parkingLotId',
  justOne: false,
});

module.exports = mongoose.model('ParkingLot', ParkingLotSchema);
