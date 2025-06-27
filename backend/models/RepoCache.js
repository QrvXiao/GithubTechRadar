const mongoose = require('mongoose');

const RepoCacheSchema = new mongoose.Schema({
  fetchedAt: { type: Date, required: true },
  items: { type: Array, required: true }
});

module.exports = mongoose.model('RepoCache', RepoCacheSchema);