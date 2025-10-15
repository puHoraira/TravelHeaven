import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
  images: [{
    url: String,
    caption: String,
  }],
  category: {
    type: String,
    enum: ['historical', 'natural', 'adventure', 'cultural', 'beach', 'mountain', 'other'],
    default: 'other',
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

locationSchema.index({ approvalStatus: 1, createdAt: -1 });
locationSchema.index({ 'rating.average': -1 });
locationSchema.index({ views: -1 });

export const Location = mongoose.model('Location', locationSchema);
