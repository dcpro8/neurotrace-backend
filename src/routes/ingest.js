const express = require('express');
const router = express.Router();
const traceQueue = require('../queue/traceQueue');
const requireApiKey = require('../middleware/requireApiKey');

router.post('/ingest', requireApiKey, async (req, res) => {
  const { agentName, steps } = req.body;

  if (!agentName || !Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: 'agentName and steps[] are required' });
  }

  if (steps.length > 50) {
    return res.status(400).json({ error: 'too many steps' });
  }

  for (const s of steps) {
    if (!['reasoning', 'tool_call', 'tool_result', 'error'].includes(s.type)) {
      return res.status(400).json({ error: 'invalid step type' });
    }
    if (typeof s.content !== 'string' || s.content.length > 2000) {
      return res.status(400).json({ error: 'invalid step content' });
    }
  }

  const job = await traceQueue.add('process-trace', { agentName, steps });
  res.status(202).json({ message: 'Trace queued for processing', jobId: job.id });
});

module.exports = router;