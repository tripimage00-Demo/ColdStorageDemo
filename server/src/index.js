const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

dotenv.config();

// Connect to Database
connectDB();

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const commodityRoutes = require('./routes/commodityRoutes');
const chamberRoutes = require('./routes/chamberRoutes');
const stockRoutes = require('./routes/stockRoutes');
const lotRoutes = require('./routes/lotRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB connection is active before processing requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failed for request:', req.url, err.message);
    res.status(503).json({
      success: false,
      message: 'Database connection failed. Retrying...',
      error: err.message,
    });
  }
});

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint with database connection status
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'online' : 'degraded',
    database: isDbConnected ? 'connected' : 'connecting_or_disconnected',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    service: 'SmartCold Storage Management API',
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/commodities', commodityRoutes);
app.use('/api/chambers', chamberRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);

// Static frontend build serving (Production SPA)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA client-side routing fallback (for non-API GET requests)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for unmatched API requests
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Catch-all for any other unmatched routes when client/dist isn't present
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

let activeServer = null;

// Start server with automatic port incrementing if port is in use
const startServer = (port) => {
  const server = app.listen(port);

  server.on('listening', () => {
    activeServer = server;
    const actualPort = server.address().port;
    console.log(`====================================================`);
    console.log(` SmartCold Storage Management Server running on port ${actualPort}`);
    console.log(` API Base URL: http://localhost:${actualPort}/api`);
    console.log(`====================================================`);

    try {
      fs.writeFileSync(path.join(__dirname, '../.active-port'), String(actualPort), 'utf8');
    } catch (e) {
      // ignore
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${port} is in use, incrementing to ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[Server] Server listen error:', err);
    }
  });
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
  if (activeServer) {
    activeServer.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        console.log('[MongoDB] Database connection closed.');
      } catch (err) {
        console.error('[MongoDB] Error during close:', err);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const initialPort = parseInt(process.env.PORT || '5000', 10);
  startServer(initialPort);
}

module.exports = app;

