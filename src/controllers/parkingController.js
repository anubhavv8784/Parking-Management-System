const ParkingService = require('../services/parkingService');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

exports.parkVehicle = asyncHandler(async (req, res) => {
  const ticket = await ParkingService.parkVehicle(req.body);
  res.status(201).json({
    success: true,
    message: 'Vehicle parked and slot allocated successfully',
    data: ticket,
  });
});

exports.unparkVehicle = asyncHandler(async (req, res) => {
  const { ticketNumber, vehicleNumber } = req.body;
  const result = await ParkingService.unparkVehicle({ ticketNumber, vehicleNumber });
  res.status(200).json({
    success: true,
    message: 'Vehicle unparked and billing processed successfully',
    data: result,
  });
});

exports.getActiveTicket = asyncHandler(async (req, res) => {
  const ticket = await ParkingService.getActiveTicketByVehicle(req.params.vehicleNumber);
  if (!ticket) {
    return res.status(404).json({
      success: false,
      error: 'No active ticket found for this vehicle',
    });
  }
  res.status(200).json({
    success: true,
    data: ticket,
  });
});
