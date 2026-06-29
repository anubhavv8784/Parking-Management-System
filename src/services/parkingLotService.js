const ParkingLot = require('../models/parkingLot');
const ParkingSlot = require('../models/parkingSlot');

class ParkingLotService {
  async createLot(lotData) {
    const lot = new ParkingLot(lotData);
    return await lot.save();
  }

  async getLotById(id) {
    return await ParkingLot.findById(id).populate('slots');
  }

  async getAllLots() {
    return await ParkingLot.find({});
  }

  async getLotStats(lotId) {
    const lot = await ParkingLot.findById(lotId);
    if (!lot) {
      throw new Error('Parking lot not found');
    }

    const slots = await ParkingSlot.find({ parkingLotId: lotId });
    const totalSlots = slots.length;

    const stats = {
      lotId,
      name: lot.name,
      totalSlots,
      availableCount: 0,
      occupiedCount: 0,
      maintenanceCount: 0,
      byType: {
        motorcycle: { total: 0, available: 0 },
        compact: { total: 0, available: 0 },
        large: { total: 0, available: 0 },
        ev: { total: 0, available: 0 },
      },
    };

    slots.forEach((slot) => {
      // General occupancies
      if (slot.status === 'available') stats.availableCount++;
      else if (slot.status === 'occupied') stats.occupiedCount++;
      else if (slot.status === 'maintenance') stats.maintenanceCount++;

      // Type-specific occupancies
      if (stats.byType[slot.slotType]) {
        stats.byType[slot.slotType].total++;
        if (slot.status === 'available') {
          stats.byType[slot.slotType].available++;
        }
      }
    });

    return stats;
  }
}

module.exports = new ParkingLotService();
