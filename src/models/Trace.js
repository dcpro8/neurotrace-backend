const mongoose = require('mongoose');

const traceSchema = new mongoose.Schema({
  agentName: { type: String, required: true },
  status: { type: String, enum: ['running', 'success', 'error', 'warning'], default: 'running' },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  summary: String
});

module.exports = mongoose.model('Trace', traceSchema);