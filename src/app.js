const express = require('express');
const connectDB = require('./config/db');

const app = express();

// Body parser middleware
app.use(express.json());

// Base health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Parking Management API is healthy' });
});

// Mounting routers
app.use('/api/lots', require('./routes/parkingLotRoutes'));
app.use('/api/slots', require('./routes/parkingSlotRoutes'));
app.use('/api/parking', require('./routes/parkingRoutes'));

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Resource not found' });
});

// Centralized Error handler
app.use((err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  
  let error = { ...err };
  error.message = err.message;

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error.message = `Resource not found with id of ${err.value}`;
    error.statusCode = 404;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    error.message = 'Duplicate field value entered/entity already exists';
    error.statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(val => val.message).join(', ');
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
});

module.exports = app;
