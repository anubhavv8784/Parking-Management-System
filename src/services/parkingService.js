const Ticket = require('../models/ticket');
const ParkingSlot = require('../models/parkingSlot');
const ParkingSlotService = require('./parkingSlotService');

class ParkingService {
  async parkVehicle({ parkingLotId, vehicleNumber, vehicleType }) {
    if (!parkingLotId || !vehicleNumber || !vehicleType) {
      throw new Error('Please provide parkingLotId, vehicleNumber, and vehicleType');
    }

    const normalizedVehicleNo = vehicleNumber.trim().toUpperCase();

    // 1. Check if vehicle is already parked to prevent duplicate entry
    const existingTicket = await Ticket.findOne({
      vehicleNumber: normalizedVehicleNo,
      status: 'active',
    });

    if (existingTicket) {
      const activeSlot = await ParkingSlot.findById(existingTicket.parkingSlotId);
      throw new Error(
        `Vehicle ${normalizedVehicleNo} is already parked in Slot ${activeSlot ? activeSlot.slotNumber : 'unknown'}`
      );
    }

    // 2. Find closest available slot matching type
    const slot = await ParkingSlotService.findAvailableSlot(parkingLotId, vehicleType);
    if (!slot) {
      throw new Error(`No available parking slot of type '${vehicleType}' in this parking lot`);
    }

    // 3. Mark the slot as occupied
    slot.status = 'occupied';
    await slot.save();

    // 4. Generate ticket number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${timestamp}-${random}`;

    // 5. Create Ticket
    const ticket = new Ticket({
      ticketNumber,
      parkingLotId,
      parkingSlotId: slot._id,
      vehicleNumber: normalizedVehicleNo,
      vehicleType,
      checkInTime: new Date(),
      status: 'active',
      paymentStatus: 'pending',
    });

    await ticket.save();

    // Return ticket details populated with slot info
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('parkingSlotId')
      .populate('parkingLotId');

    return populatedTicket;
  }

  async unparkVehicle({ ticketNumber, vehicleNumber }) {
    if (!ticketNumber && !vehicleNumber) {
      throw new Error('Please provide ticketNumber or vehicleNumber');
    }

    // 1. Find active ticket
    const query = { status: 'active' };
    if (ticketNumber) {
      query.ticketNumber = ticketNumber;
    } else {
      query.vehicleNumber = vehicleNumber.trim().toUpperCase();
    }

    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      throw new Error('Active ticket not found for the provided information');
    }

    // 2. Retrieve corresponding slot
    const slot = await ParkingSlot.findById(ticket.parkingSlotId);
    if (!slot) {
      throw new Error('Associated parking slot not found');
    }

    // 3. Calculate parking billing fee
    const checkOutTime = new Date();
    const durationMs = checkOutTime - new Date(ticket.checkInTime);
    
    // Convert to hours (round up to nearest hour)
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const finalHours = Math.max(1, durationHours); // Minimum charge of 1 hour

    const totalFee = finalHours * slot.hourlyRate;

    // 4. Free up slot
    slot.status = 'available';
    await slot.save();

    // 5. Update Ticket status, fee and checkout
    ticket.checkOutTime = checkOutTime;
    ticket.status = 'completed';
    ticket.totalFee = totalFee;
    ticket.paymentStatus = 'paid';
    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('parkingSlotId')
      .populate('parkingLotId');

    return {
      ticket: populatedTicket,
      durationHours: finalHours,
      hourlyRate: slot.hourlyRate,
      totalFee,
    };
  }

  async getActiveTicketByVehicle(vehicleNumber) {
    return await Ticket.findOne({
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      status: 'active',
    }).populate('parkingSlotId');
  }
}

module.exports = new ParkingService();
