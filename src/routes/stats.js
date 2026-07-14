const express = require('express');
const router = express.Router();
const Trace = require('../models/Trace');
const TraceChunk = require('../models/TraceChunk');
const generateEmbedding = require('../embeddings/generateEmbedding');

router.get('/stats', async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [tracesToday, anomaliesFlagged] = await Promise.all([
      Trace.countDocuments({ startedAt: { $gte: oneDayAgo } }),
      Trace.countDocuments({ status: 'error' })
    ]);

    const start = Date.now();
    const benchmarkEmbedding = await generateEmbedding('system health check');
    await TraceChunk.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: benchmarkEmbedding,
          numCandidates: 50,
          limit: 1
        }
      }
    ]);
    const avgRetrievalMs = Date.now() - start;

    res.json({ tracesToday, anomaliesFlagged, avgRetrievalMs });
  } catch (err) {
    console.error('Stats failed:', err);
    res.status(500).json({ error: 'stats failed' });
  }
});

module.exports = router;