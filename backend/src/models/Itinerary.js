import mongoose from 'mongoose';

const itineraryActivitySchema = new mongoose.Schema({
  // References to existing approved content (optional)
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

  // Free-form activity fields (used by AI + manual planner)
  timeOfDay: String, // e.g. "Morning", "Afternoon", "Evening" or "09:00-11:00"
  customName: String,
  customDescription: String,
  customCoordinates: {
    latitude: Number,
    longitude: Number,
  },

  // Legacy/compat fields used by frontend pages (kept so data persists)
  order: Number,
  notes: String,
  estimatedCost: Number,
}, { _id: false });

const itineraryDaySchema = new mongoose.Schema({
  dayNumber: Number,
  date: Date,
  title: String,
  description: String,
  // Keep `stops` name for backwards compatibility with existing UI.
  // Conceptually, each stop == an itinerary activity/time block.
  stops: [itineraryActivitySchema],
}, { _id: false });

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
  destination: {
    type: String,
    trim: true,
  },
  createdByRole: {
    type: String,
    enum: ['user', 'guide'],
    default: 'user',
  },
  source: {
    type: String,
    enum: ['manual', 'ai-route-adviser', 'smart-recommendation'],
    default: 'manual',
  },
  pricing: {
    amount: Number,
    currency: {
      type: String,
      default: 'BDT',
    },
    contactForPrice: {
      type: Boolean,
      default: false,
    },
    notes: String,
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
  days: [itineraryDaySchema],
  budget: {
    total: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    expenses: [{
      name: String,
      amount: Number,
      category: {
        type: String,
        enum: ['accommodation', 'transport', 'food', 'activities', 'shopping', 'other'],
        default: 'other'
      },
      paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      splitAmong: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      dayNumber: Number,  // ADD THIS LINE - links expense to specific day
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
itinerarySchema.index({ destination: 1, createdAt: -1 });
itinerarySchema.index({ createdByRole: 1, createdAt: -1 });
itinerarySchema.index({ source: 1, createdAt: -1 });

export const Itinerary = mongoose.model('Itinerary', itinerarySchema);
