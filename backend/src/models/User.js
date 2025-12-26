import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guide'],
    default: 'user',
  },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String,
    bio: String,
    location: String,
    languages: [String],
    specialties: [String],
  },
  guideInfo: {
    experience: String,
    priceRange: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },
    availability: String,
    contactMethods: {
      phone: String,
      whatsapp: String,
      email: String,
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
    // Guide verification documents stored in MongoDB
    verificationDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
    verificationResubmittedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ role: 1, 'guideInfo.rating.average': -1 });

export const User = mongoose.model('User', userSchema);
