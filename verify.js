const mongoose = require('mongoose');
const ParkingLotService = require('./src/services/parkingLotService');
const ParkingSlotService = require('./src/services/parkingSlotService');
const ParkingService = require('./src/services/parkingService');
const ParkingLot = require('./src/models/parkingLot');
const ParkingSlot = require('./src/models/parkingSlot');
const Ticket = require('./src/models/ticket');

const MONGO_TEST_URI = 'mongodb://localhost:27017/parking_db_test';

async function run() {
  console.log('--- STARTING PARKING MANAGEMENT SYSTEM INTEGRATION TESTS ---');
  
  // 1. Connect to test DB
  console.log(`Connecting to database: ${MONGO_TEST_URI}`);
  await mongoose.connect(MONGO_TEST_URI);
  
  // Clean test database
  console.log('Cleaning existing test schemas...');
  await ParkingLot.deleteMany({});
  await ParkingSlot.deleteMany({});
  await Ticket.deleteMany({});

  try {
    // 2. Create Parking Lot
    console.log('\nStep 1: Creating a new Parking Lot...');
    const lot = await ParkingLotService.createLot({
      name: 'Lot Alpha',
      address: '123 Main Street',
    });
    console.log(`Lot created successfully: ${lot.name} (${lot._id})`);

    // 3. Create Parking Slots
    console.log('\nStep 2: Seeding slots with varying distance scores & rates...');
    // Seeding Motorcycle slot (further - Distance 2)
    const slotM1 = await ParkingSlotService.createSlot({
      parkingLotId: lot._id,
      slotNumber: 'M-01',
      floor: 'Ground',
      slotType: 'motorcycle',
      hourlyRate: 10,
      distanceScore: 2,
    });
    // Seeding Motorcycle slot (closer - Distance 1)
    const slotM2 = await ParkingSlotService.createSlot({
      parkingLotId: lot._id,
      slotNumber: 'M-02',
      floor: 'Ground',
      slotType: 'motorcycle',
      hourlyRate: 10,
      distanceScore: 1,
    });
    // Seeding Compact slots
    const slotC1 = await ParkingSlotService.createSlot({
      parkingLotId: lot._id,
      slotNumber: 'C-01',
      floor: 'Ground',
      slotType: 'compact',
      hourlyRate: 20,
      distanceScore: 3,
    });
    const slotC2 = await ParkingSlotService.createSlot({
      parkingLotId: lot._id,
      slotNumber: 'C-02',
      floor: 'Ground',
      slotType: 'compact',
      hourlyRate: 20,
      distanceScore: 1,
    });
    // Seeding EV slot
    const slotE1 = await ParkingSlotService.createSlot({
      parkingLotId: lot._id,
      slotNumber: 'E-01',
      floor: '1st Floor',
      slotType: 'ev',
      hourlyRate: 30,
      distanceScore: 1,
    });

    console.log(`Successfully created slots: M-01, M-02, C-01, C-02, E-01`);

    // 4. Test Auto-Allocation (Checking in vehicles)
    console.log('\nStep 3: Simulating vehicle check-in (auto-allocation based on distance score)...');
    
    // Park first motorcycle: should choose slot M-02 (distance score: 1) instead of M-01 (distance score: 2)
    console.log('Parking Vehicle: MH-12-AA-1111 (motorcycle)...');
    const tkt1 = await ParkingService.parkVehicle({
      parkingLotId: lot._id,
      vehicleNumber: 'MH-12-AA-1111',
      vehicleType: 'motorcycle',
    });
    console.log(`Vehicle MH-12-AA-1111 allocated Slot: ${tkt1.parkingSlotId.slotNumber} (Distance Score: ${tkt1.parkingSlotId.distanceScore})`);
    if (tkt1.parkingSlotId.slotNumber !== 'M-02') {
      throw new Error(`Integration error: Expected nearest slot M-02, got ${tkt1.parkingSlotId.slotNumber}`);
    }

    // Park second motorcycle: should choose remaining slot M-01
    console.log('\nParking Vehicle: MH-12-BB-2222 (motorcycle)...');
    const tkt2 = await ParkingService.parkVehicle({
      parkingLotId: lot._id,
      vehicleNumber: 'MH-12-BB-2222',
      vehicleType: 'motorcycle',
    });
    console.log(`Vehicle MH-12-BB-2222 allocated Slot: ${tkt2.parkingSlotId.slotNumber}`);
    if (tkt2.parkingSlotId.slotNumber !== 'M-01') {
      throw new Error(`Integration error: Expected slot M-01, got ${tkt2.parkingSlotId.slotNumber}`);
    }

    // Park third motorcycle: should fail as lot is full of motorcycle slots
    console.log('\nParking Vehicle: MH-12-CC-3333 (motorcycle) - Expecting failure...');
    try {
      await ParkingService.parkVehicle({
        parkingLotId: lot._id,
        vehicleNumber: 'MH-12-CC-3333',
        vehicleType: 'motorcycle',
      });
      throw new Error('Test failed: Should not have successfully parked since slots are full');
    } catch (err) {
      console.log(`Expected check-in rejection: "${err.message}"`);
    }

    // Checking lot stats
    let stats = await ParkingLotService.getLotStats(lot._id);
    console.log('\nCurrent stats of ParkingLot:');
    console.log(`Total slots: ${stats.totalSlots}, Available: ${stats.availableCount}, Occupied: ${stats.occupiedCount}`);
    console.log(`Motorcycles capacity details: Total: ${stats.byType.motorcycle.total}, Available: ${stats.byType.motorcycle.available}`);

    // Park compact car: should choose slot C-02 (distance 1) over C-01 (distance 3)
    console.log('\nParking Vehicle: MH-12-DD-4444 (compact)...');
    const tkt3 = await ParkingService.parkVehicle({
      parkingLotId: lot._id,
      vehicleNumber: 'MH-12-DD-4444',
      vehicleType: 'compact',
    });
    console.log(`Vehicle MH-12-DD-4444 allocated Slot: ${tkt3.parkingSlotId.slotNumber}`);
    if (tkt3.parkingSlotId.slotNumber !== 'C-02') {
      throw new Error(`Integration error: Expected nearest slot C-02, got ${tkt3.parkingSlotId.slotNumber}`);
    }

    // 5. Test Check-out with billing logic modification
    console.log('\nStep 4: Simulating checkout with billing (manipulating timestamps)...');
    
    // Fetch and manipulate the checkInTime for MH-12-AA-1111 to simulate duration
    const ticketToModify = await Ticket.findById(tkt1._id);
    // Backdate checkInTime by 2 hours and 15 minutes (2.25 hours) -> rounds up to 3 hours
    const backdateHours = 2.25;
    ticketToModify.checkInTime = new Date(Date.now() - backdateHours * 60 * 60 * 1000);
    await ticketToModify.save();
    console.log(`Backdated check-in time for Ticket ${tkt1.ticketNumber} by ${backdateHours} hours.`);

    // Perform check-out
    console.log('Checking out vehicle MH-12-AA-1111...');
    const checkoutResult = await ParkingService.unparkVehicle({
      vehicleNumber: 'MH-12-AA-1111',
    });
    
    console.log('\n=== INVOICE DETAILS ===');
    console.log(`Ticket Number: ${checkoutResult.ticket.ticketNumber}`);
    console.log(`Vehicle Number: ${checkoutResult.ticket.vehicleNumber}`);
    console.log(`Slot Number: ${checkoutResult.ticket.parkingSlotId.slotNumber}`);
    console.log(`Hourly Rate: Rs. ${checkoutResult.hourlyRate}`);
    console.log(`Duration calculated (hours): ${checkoutResult.durationHours}`);
    console.log(`Total Billing Amount: Rs. ${checkoutResult.totalFee}`);
    console.log(`Invoice Status: ${checkoutResult.ticket.paymentStatus}`);
    console.log('=======================\n');

    if (checkoutResult.durationHours !== 3) {
      throw new Error(`Billing error: Expected rounded up hours to be 3, got ${checkoutResult.durationHours}`);
    }
    if (checkoutResult.totalFee !== 30) {
      throw new Error(`Billing error: Expected total fee of 30, got ${checkoutResult.totalFee}`);
    }

    // Verify slot M-02 is free again
    const freedSlot = await ParkingSlot.findById(tkt1.parkingSlotId._id);
    console.log(`Verifying Slot ${freedSlot.slotNumber} status: ${freedSlot.status}`);
    if (freedSlot.status !== 'available') {
      throw new Error(`Status error: Expected slot M-02 to be 'available', got ${freedSlot.status}`);
    }

    // 6. Rent the slot again to prove reuse
    console.log('\nStep 5: Verify reuse of the freed slot...');
    console.log('Parking Vehicle: MH-12-EE-5555 (motorcycle)...');
    const tkt4 = await ParkingService.parkVehicle({
      parkingLotId: lot._id,
      vehicleNumber: 'MH-12-EE-5555',
      vehicleType: 'motorcycle',
    });
    console.log(`Vehicle MH-12-EE-5555 (motorcycle) allocated Slot: ${tkt4.parkingSlotId.slotNumber}`);
    if (tkt4.parkingSlotId.slotNumber !== 'M-02') {
      throw new Error(`Integration error: Expected slot M-02 to be reused, got ${tkt4.parkingSlotId.slotNumber}`);
    }

    // Final occupancy check
    stats = await ParkingLotService.getLotStats(lot._id);
    console.log('\nFinal Stats of ParkingLot:');
    console.log(`Total slots: ${stats.totalSlots}, Available: ${stats.availableCount}, Occupied: ${stats.occupiedCount}`);

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! ---');

  } catch (error) {
    console.error('\n--- TEST FAILED ---');
    console.error(error);
    process.exit(1);
  } finally {
    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
