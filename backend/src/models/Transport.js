import mongoose from 'mongoose';

// Sub-schema for detailed stop information with GPS coordinates
const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  address: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
  },
  stopOrder: Number,
  estimatedArrival: String,
  facilities: [String],
  landmark: String,
}, { _id: false });

const transportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['bus', 'train', 'taxi', 'rental-car', 'flight', 'boat', 'launch', 'cng', 'rickshaw', 'other'],
    required: true,
  },
  description: String,
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: false, // Optional - now using GPS-based route system
  },
  
  // Enhanced operator information
  operator: {
    name: String,
    logo: String,
    type: {
      type: String,
      enum: ['government', 'private', 'ride-sharing', 'local'],
      default: 'private',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
  },

  // Enhanced route with GPS coordinates
  route: {
    from: {
      name: String,
      address: String,
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
    },
    to: {
      name: String,
      address: String,
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
        },
      },
    },
    stops: [stopSchema],
    distance: {
      value: Number,
      unit: {
        type: String,
        default: 'km',
      },
    },
    duration: {
      estimated: String,
    },
  },

  // Enhanced schedule
  schedule: {
    departures: [String],
    frequency: String,
    operatingHours: String,
    daysOfWeek: [String],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },

  // Enhanced pricing
  pricing: {
    amount: Number,
    currency: {
      type: String,
      default: 'BDT',
    },
    priceType: {
      type: String,
      enum: ['per-person', 'per-trip', 'per-hour', 'per-day', 'per-km'],
      default: 'per-person',
    },
    classes: [{
      name: String,
      price: Number,
      facilities: [String],
    }],
    priceNote: String,
  },

  // Booking information
  booking: {
    methods: [{
      type: String,
      enum: ['online', 'counter', 'phone', 'app', 'agent'],
    }],
    onlineUrl: String,
    phoneNumbers: [String],
    counterLocations: [String],
    appDeepLink: String,
    instructions: String,
    advanceBookingDays: Number,
  },

  contactInfo: {
    phone: [String],
    email: String,
    website: String,
    whatsapp: String,
    facebook: String,
    address: String,
  },

  facilities: [{
    type: String,
    enum: [
      'ac',
      'wifi',
      'toilet',
      'tv',
      'charging', // added to match frontend value
      'charging-port',
      'blanket',
      'snacks',
      'water',
      'music',
      'reclining-seat',
    ],
  }],

  capacity: {
    total: Number,
    available: Number,
  },

  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },

  images: [{
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    caption: String,
  }],

  accessibility: {
    wheelchairAccessible: Boolean,
    disabledFriendly: Boolean,
    childFriendly: Boolean,
  },

  safetyFeatures: [String],

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

  viewCount: {
    type: Number,
    default: 0,
  },
  bookingCount: {
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

// Indexes
transportSchema.index({ approvalStatus: 1, locationId: 1, type: 1 });
transportSchema.index({ 'route.from.location': '2dsphere' });
transportSchema.index({ 'route.to.location': '2dsphere' });
transportSchema.index({ 'route.stops.location': '2dsphere' });
transportSchema.index({ 'operator.name': 1 });
transportSchema.index({ averageRating: -1 });

// Methods
transportSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

transportSchema.methods.updateRating = function(newRating) {
  const totalRatings = this.totalReviews * this.averageRating;
  this.totalReviews += 1;
  this.averageRating = (totalRatings + newRating) / this.totalReviews;
  return this.save();
};

export const Transport = mongoose.model('Transport', transportSchema);
