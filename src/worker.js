require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // same fix as yesterday

const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const connection = require('./queue/connection');
const Trace = require('./models/Trace');
const TraceStep = require('./models/TraceStep');
const chunkSteps = require('./chunking/chunkTrace');
const generateEmbedding = require('./embeddings/generateEmbedding');
const TraceChunk = require('./models/TraceChunk');

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
    
    const chunks = chunkSteps(stepDocs);
    
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);
      await TraceChunk.create({
        traceId: trace._id,
        stepRange: chunk.stepRange,
        text: chunk.text,
        embedding
      });
    }

    console.log(`Embedded ${chunks.length} chunks for trace ${trace._id}`);

  }, { connection });

  worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err.message));
}

start();