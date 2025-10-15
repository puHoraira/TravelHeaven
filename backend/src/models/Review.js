import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewType: {
    type: String,
    enum: ['location', 'hotel', 'transport', 'guide', 'itinerary'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'reviewType',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  images: [{
    url: String,
    caption: String,
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isVerified: {
    type: Boolean,
    default: false,
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

reviewSchema.index({ reviewType: 1, referenceId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });

export const Review = mongoose.model('Review', reviewSchema);
