const express = require('express');
const router = express.Router();
const Trace = require('../models/Trace');
const TraceStep = require('../models/TraceStep');

router.get('/', async (req, res) => {
  try {
    const traces = await Trace.find().sort({ startedAt: -1 }).limit(20);
    res.json(traces);
  } catch (err) {
    console.error('List traces failed:', err);
    res.status(500).json({ error: 'failed to list traces' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const trace = await Trace.findById(req.params.id);
    if (!trace) return res.status(404).json({ error: 'trace not found' });

    const steps = await TraceStep.find({ traceId: trace._id }).sort({ stepIndex: 1 });
    res.json({ trace, steps });
  } catch (err) {
    console.error('Get trace failed:', err);
    res.status(500).json({ error: 'failed to get trace' });
  }
});

module.exports = router;