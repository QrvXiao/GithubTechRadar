import mongoose from 'mongoose';

const repoDataSchema = new mongoose.Schema({
  repoId: { 
    type: Number, 
    required: true,
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  url: { 
    type: String, 
    required: true 
  },
  description: String,
  stars: { 
    type: Number, 
    required: true,
    min: 0
  },
  forks: { 
    type: Number, 
    default: 0,
    min: 0
  },
  language: { 
    type: String, 
    required: true,
    index: true 
  },
  createdAt: {
    type: Date,
    required: true
  },
  updatedAt: {
    type: Date,
    required: true
  },
  lastFetched: { 
    type: Date, 
    default: Date.now 
  },
  timeRange: {
    type: String,
    enum: ['1d', '7d', '30d'],
    default: '7d',
    index: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound indexes
repoDataSchema.index({ language: 1, timeRange: 1 });
repoDataSchema.index({ stars: -1 });
repoDataSchema.index({ lastFetched: -1 });

export default mongoose.model('RepoData', repoDataSchema);