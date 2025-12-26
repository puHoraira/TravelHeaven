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
import itineraryRoutes from './routes/itinerary.routes.js';
import reviewRoutes from './routes/review.routes.js';
import guideRoutes from './routes/guide.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import expenseRoutes from './routes/expense.route.js';
import aiRoutes from './routes/ai.routes.js';
import railwayRoutes from './routes/railway.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import fileRoutes from './routes/file.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/itineraries/:itineraryId/expenses', expenseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/railway', railwayRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/files', fileRoutes);

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




