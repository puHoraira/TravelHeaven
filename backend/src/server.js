import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DatabaseConnection } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js';
import hotelRoutes from './routes/hotel.routes.js';
import transportRoutes from './routes/transport.routes.js';
import adminRoutes from './routes/admin.routes.js';
import bookingRoutes from './routes/booking.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Database Connection (Singleton Pattern)
const db = DatabaseConnection.getInstance();
await db.connect();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/transportation', transportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV}`);
});

export default app;
