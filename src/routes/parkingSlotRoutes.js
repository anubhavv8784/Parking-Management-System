const express = require('express');
const router = express.Router();
const { createSlot, getSlotsByLot, updateSlotStatus } = require('../controllers/parkingSlotController');

router.route('/')
  .post(createSlot);

router.route('/lot/:lotId')
  .get(getSlotsByLot);

router.route('/:id/status')
  .put(updateSlotStatus);

module.exports = router;
