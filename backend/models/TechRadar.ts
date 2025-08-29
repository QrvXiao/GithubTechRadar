import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  url: { type: String, required: true },
  description: String,
  stars: { type: Number, default: 0 },
  forks: { type: Number, default: 0 }
});

const techRadarSchema = new mongoose.Schema({
  language: { 
    type: String, 
    required: true, 
    index: true 
  },
  totalStars: { 
    type: Number, 
    required: true,
    min: 0
  },
  totalForks: { 
    type: Number, 
    default: 0,
    min: 0
  },
  trendingScore: { 
    type: Number, 
    required: true,
    min: 0
  },
  repositoryCount: {
    type: Number,
    default: 0
  },
  topRepositories: [repositorySchema],
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  timeRange: {
    type: String,
    enum: ['1d', '7d', '30d'],
    default: '7d'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound indexes
techRadarSchema.index({ language: 1, timeRange: 1 });
techRadarSchema.index({ trendingScore: -1 });

// virtual field
techRadarSchema.virtual('averageStars').get(function() {
  return this.repositoryCount > 0 ? Math.round(this.totalStars / this.repositoryCount) : 0;
});

export default mongoose.model('TechRadar', techRadarSchema);