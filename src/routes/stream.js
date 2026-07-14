const express = require('express');
const router = express.Router();
const traceEvents = require('../events/traceEvents');

router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders?.();

  const onNewTrace = (trace) => {
    res.write(`data: ${JSON.stringify(trace)}\n\n`);
  };
  traceEvents.on('new-trace', onNewTrace);

  // keep the connection alive through proxies/load balancers (Render included)
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    traceEvents.off('new-trace', onNewTrace);
  });
});

module.exports = router;