const express = require('express');
const router = express.Router();
const { createLot, getAllLots, getLotById, getLotStats } = require('../controllers/parkingLotController');

router.route('/')
  .post(createLot)
  .get(getAllLots);

router.route('/:id')
  .get(getLotById);

router.route('/:id/stats')
  .get(getLotStats);

module.exports = router;
