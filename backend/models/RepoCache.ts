import mongoose from 'mongoose';

const RepoCacheSchema = new mongoose.Schema({
  fetchedAt: { type: Date, required: true },
  items: { type: Array, required: true }
});

export default mongoose.model('RepoCache', RepoCacheSchema);