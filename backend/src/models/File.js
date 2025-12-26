import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  data: {
    type: Buffer,
    required: true,
  },
  encoding: {
    type: String,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['User', 'Location', 'Hotel', 'Transport', 'Review', 'Itinerary'],
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  metadata: {
    caption: String,
    description: String,
    tags: [String],
  },
}, {
  timestamps: true,
});

// Index for efficient queries
fileSchema.index({ filename: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ 'relatedTo.model': 1, 'relatedTo.id': 1 });

// Virtual for file URL
fileSchema.virtual('url').get(function() {
  return `/api/files/${this._id}`;
});

// Method to get base64 data URL
fileSchema.methods.toDataURL = function() {
  return `data:${this.mimetype};base64,${this.data.toString('base64')}`;
};

// Don't include the binary data in JSON responses by default
fileSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.data;
    return ret;
  },
});

const File = mongoose.model('File', fileSchema);

export default File;
