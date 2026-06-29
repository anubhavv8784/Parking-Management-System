const ParkingSlotService = require('../services/parkingSlotService');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

exports.createSlot = asyncHandler(async (req, res) => {
  const slot = await ParkingSlotService.createSlot(req.body);
  res.status(201).json({
    success: true,
    data: slot,
  });
});

exports.getSlotsByLot = asyncHandler(async (req, res) => {
  const slots = await ParkingSlotService.getSlotsByLot(req.params.lotId);
  res.status(200).json({
    success: true,
    count: slots.length,
    data: slots,
  });
});

exports.updateSlotStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const slot = await ParkingSlotService.updateSlotStatus(req.params.id, status);
  res.status(200).json({
    success: true,
    data: slot,
  });
});
