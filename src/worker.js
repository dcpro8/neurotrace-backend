require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // same fix as yesterday

const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const connection = require('./queue/connection');
const Trace = require('./models/Trace');
const TraceStep = require('./models/TraceStep');

async function start() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Worker connected to MongoDB');

  const worker = new Worker('trace-ingestion', async job => {
    const { agentName, steps } = job.data;

    const trace = await Trace.create({
      agentName,
      status: steps.some(s => s.type === 'error') ? 'error' : 'success',
      endedAt: new Date()
    });

    const stepDocs = steps.map((s, i) => ({
      traceId: trace._id,
      stepIndex: i,
      type: s.type,
      content: s.content,
      timestamp: s.timestamp || new Date(),
      durationMs: s.durationMs
    }));

    await TraceStep.insertMany(stepDocs);
    console.log(`Processed trace ${trace._id} (${stepDocs.length} steps)`);
  }, { connection });

  worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err.message));
}

start();