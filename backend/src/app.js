const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const recommendationRoutes = require('./routes/recommendations');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const aiAssistantRoutes = require('./routes/aiAssistant');
const notificationRoutes = require('./routes/notifications');
const businessInsightsRoutes = require('./routes/businessInsights');
const userActivityRoutes = require('./routes/userActivity');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001", 
      "http://localhost:3002",
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:3002",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) }}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
// Temporarily disable rate limiter for development
// app.use(rateLimiter);

// Store io instance for use in other modules
app.set('io', io);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qwipo-recommendations')
.then(() => logger.info('Connected to MongoDB'))
.catch(err => logger.error('MongoDB connection error:', err));

// Socket.io for real-time features
io.on('connection', (socket) => {
  logger.info('User connected:', socket.id);

  socket.on('join-room', (userId) => {
    socket.join(userId);
    logger.info(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    logger.info('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/business-insights', businessInsightsRoutes);
app.use('/api/activity', userActivityRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Cron jobs for automated tasks
cron.schedule('0 */6 * * *', () => {
  logger.info('Running ML model retraining...');
  // TODO: Implement ML model retraining
});

cron.schedule('0 9 * * *', () => {
  logger.info('Sending daily recommendation updates...');
  // TODO: Implement daily recommendation emails
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
