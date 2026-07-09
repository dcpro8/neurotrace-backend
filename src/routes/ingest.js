const express = require('express');
const router = express.Router();
const traceQueue = require('../queue/traceQueue');

router.post('/ingest', async (req, res) => {
  const { agentName, steps } = req.body;

  if (!agentName || !Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: 'agentName and steps[] are required' });
  }

  const job = await traceQueue.add('process-trace', { agentName, steps });
  res.status(202).json({ message: 'Trace queued for processing', jobId: job.id });
});

module.exports = router;