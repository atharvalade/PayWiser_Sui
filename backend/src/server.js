const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const walletRoutes = require('./routes/wallet');
const transferRoutes = require('./routes/transfer');
const sponsorRoutes = require('./routes/sponsor');
const faceEnrollmentRoutes = require('./routes/faceEnrollment');
const sealRoutes = require('./routes/seal');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/wallet', walletRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/sponsor', sponsorRoutes);
app.use('/api/face', faceEnrollmentRoutes);
app.use('/api/seal', sealRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    network: process.env.SUI_NETWORK || 'testnet'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 PayWiser Sui Backend running on port ${PORT}`);
  console.log(`🌐 Network: ${process.env.SUI_NETWORK || 'testnet'}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
