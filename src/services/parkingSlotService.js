const ParkingSlot = require('../models/parkingSlot');
const ParkingLot = require('../models/parkingLot');

class ParkingSlotService {
  async createSlot(slotData) {
    // Check if lot exists
    const lot = await ParkingLot.findById(slotData.parkingLotId);
    if (!lot) {
      throw new Error('Parking lot not found');
    }

    const slot = new ParkingSlot(slotData);
    return await slot.save();
  }

  async updateSlotStatus(slotId, status) {
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      throw new Error('Parking slot not found');
    }

    if (!['available', 'occupied', 'maintenance'].includes(status)) {
      throw new Error('Invalid status');
    }

    slot.status = status;
    return await slot.save();
  }

  async getSlotsByLot(parkingLotId) {
    return await ParkingSlot.find({ parkingLotId }).sort({ slotNumber: 1 });
  }

  async findAvailableSlot(parkingLotId, slotType) {
    // Find slot with status 'available' and matching slotType
    // Sort by distanceScore ascending (lower distance score means closer, which is preferred)
    return await ParkingSlot.findOne({
      parkingLotId,
      slotType,
      status: 'available',
    }).sort({ distanceScore: 1 });
  }
}

module.exports = new ParkingSlotService();
