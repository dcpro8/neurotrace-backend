const express = require('express');
const router = express.Router();
const generateEmbedding = require('../embeddings/generateEmbedding');
const TraceChunk = require('../models/TraceChunk');

router.post('/query', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const queryEmbedding = await generateEmbedding(question);

    const results = await TraceChunk.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 5
        }
      },
      {
        $project: {
          text: 1,
          traceId: 1,
          stepRange: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]);

    res.json({ question, results });
  } catch (err) {
    console.error('Query failed:', err);
    res.status(500).json({ error: 'query failed' });
  }
});

module.exports = router;