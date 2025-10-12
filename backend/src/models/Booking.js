import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingType: {
    type: String,
    enum: ['hotel', 'transport', 'package'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  bookingDetails: {
    startDate: Date,
    endDate: Date,
    numberOfPeople: Number,
    specialRequests: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  totalPrice: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD',
    },
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

bookingSchema.index({ userId: 1, status: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
