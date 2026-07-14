const express = require('express');
const router = express.Router();
const generateEmbedding = require('../embeddings/generateEmbedding');
const generateAnswer = require('../generation/generateAnswer');
const TraceChunk = require('../models/TraceChunk');

router.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });

  try {
    const queryEmbedding = await generateEmbedding(question);

    const chunks = await TraceChunk.aggregate([
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

    if (chunks.length === 0) {
      return res.json({ question, answer: "I couldn't find any relevant trace data to answer that.", citations: [] });
    }

    const answer = await generateAnswer(question, chunks);

    res.json({
      question,
      answer,
      citations: chunks.map(c => ({ traceId: c.traceId, stepRange: c.stepRange, score: c.score }))
    });
  } catch (err) {
    console.error('Ask failed:', err);
    res.status(500).json({ error: 'ask failed' });
  }
});

module.exports = router;