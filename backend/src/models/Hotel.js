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
    required: false,
  },
  address: {
    street: String,
    city: String,
    country: String,
    zipCode: String,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude] - GeoJSON format
      required: true,
    },
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
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
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    caption: String,
  }],
  rooms: [{
    roomType: { type: String, trim: true },
    bedType: { type: String, trim: true },
    capacity: { type: Number, min: 1 },
    pricePerNight: { type: Number, min: 0 },
    currency: { type: String, default: 'USD' },
    amenities: [String],
    photos: [{ 
      file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
      caption: String 
    }],
    notes: String,
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
  resubmittedAt: Date,
  views: {
    type: Number,
    default: 0,
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

hotelSchema.index({ approvalStatus: 1, locationId: 1 });
hotelSchema.index({ 'rating.average': -1 });
hotelSchema.index({ views: -1 });
hotelSchema.index({ 'location': '2dsphere' }); // Geospatial index for nearby search

export const Hotel = mongoose.model('Hotel', hotelSchema);
