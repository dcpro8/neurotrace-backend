const mongoose = require('mongoose');

const traceStepSchema = new mongoose.Schema({
  traceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trace', required: true },
  stepIndex: { type: Number, required: true },
  type: { type: String, enum: ['reasoning', 'tool_call', 'tool_result', 'error'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  durationMs: Number
});

module.exports = mongoose.model('TraceStep', traceStepSchema);