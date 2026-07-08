const mongoose = require('mongoose');

const traceChunkSchema = new mongoose.Schema({
  traceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trace', required: true },
  stepRange: { start: Number, end: Number },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true }
});

module.exports = mongoose.model('TraceChunk', traceChunkSchema);