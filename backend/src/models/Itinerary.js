import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'comment', 'suggest'],
      default: 'view',
    },
  }],
  isPublic: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  days: [{
    dayNumber: Number,
    date: Date,
    title: String,
    description: String,
    stops: [{
      locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
      },
      hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
      },
      transportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transport',
      },
      customName: String,
      customDescription: String,
      customCoordinates: {
        latitude: Number,
        longitude: Number,
      },
      order: Number,
      notes: String,
      estimatedCost: Number,
    }],
  }],
  budget: {
    total: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    expenses: [{
      name: String,
      amount: Number,
      category: String,
      paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      splitAmong: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      date: Date,
      notes: String,
    }],
  },
  tags: [String],
  status: {
    type: String,
    enum: ['planning', 'active', 'completed'],
    default: 'planning',
  },
  completeness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  activityLog: [{
    type: {
      type: String,
      enum: ['update', 'comment', 'suggestion'],
      default: 'update',
    },
    message: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
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

itinerarySchema.index({ ownerId: 1, createdAt: -1 });
itinerarySchema.index({ isPublic: 1, createdAt: -1 });
itinerarySchema.index({ 'collaborators.userId': 1 });
itinerarySchema.index({ views: -1 });

export const Itinerary = mongoose.model('Itinerary', itinerarySchema);
