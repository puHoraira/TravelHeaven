import mongoose from 'mongoose';

const transportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['bus', 'train', 'taxi', 'rental-car', 'flight', 'boat', 'other'],
    required: true,
  },
  description: String,
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
  route: {
    from: String,
    to: String,
    stops: [String],
  },
  schedule: {
    frequency: String,
    operatingHours: String,
    daysOfWeek: [String],
  },
  pricing: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    priceType: {
      type: String,
      enum: ['per-person', 'per-trip', 'per-hour', 'per-day'],
      default: 'per-person',
    },
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String,
  },
  images: [{
    url: String,
    caption: String,
  }],
  guideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

transportSchema.index({ approvalStatus: 1, locationId: 1, type: 1 });

export const Transport = mongoose.model('Transport', transportSchema);
