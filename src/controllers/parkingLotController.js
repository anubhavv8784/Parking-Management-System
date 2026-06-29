const ParkingLotService = require('../services/parkingLotService');

// Helper to catch async function errors and hand them to Next error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

exports.createLot = asyncHandler(async (req, res) => {
  const lot = await ParkingLotService.createLot(req.body);
  res.status(201).json({
    success: true,
    data: lot,
  });
});

exports.getAllLots = asyncHandler(async (req, res) => {
  const lots = await ParkingLotService.getAllLots();
  res.status(200).json({
    success: true,
    count: lots.length,
    data: lots,
  });
});

exports.getLotById = asyncHandler(async (req, res) => {
  const lot = await ParkingLotService.getLotById(req.params.id);
  if (!lot) {
    return res.status(404).json({ success: false, error: 'Parking lot not found' });
  }
  res.status(200).json({
    success: true,
    data: lot,
  });
});

exports.getLotStats = asyncHandler(async (req, res) => {
  const stats = await ParkingLotService.getLotStats(req.params.id);
  res.status(200).json({
    success: true,
    data: stats,
  });
});
