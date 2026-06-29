const express = require('express');
const router = express.Router();
const { parkVehicle, unparkVehicle, getActiveTicket } = require('../controllers/parkingController');

router.route('/park')
  .post(parkVehicle);

router.route('/unpark')
  .post(unparkVehicle);

router.route('/ticket/:vehicleNumber')
  .get(getActiveTicket);

module.exports = router;
