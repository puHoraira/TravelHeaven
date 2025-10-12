import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
  address: {
    street: String,
    city: String,
    country: String,
    zipCode: String,
  },
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  amenities: [String],
  priceRange: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD',
    },
  },
  images: [{
    url: String,
    caption: String,
  }],
  contactInfo: {
    phone: String,
    email: String,
    website: String,
  },
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

hotelSchema.index({ approvalStatus: 1, locationId: 1 });

export const Hotel = mongoose.model('Hotel', hotelSchema);
