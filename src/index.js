require('dotenv').config({ quiet: true });
const express = require('express');
const connectDB = require('./db');
const ingestRouter = require('./routes/ingest');
const startWorker = require('./worker');

const app = express();
app.use(express.json());
app.use('/traces', ingestRouter);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const queryRouter = require('./routes/query');
app.use('/traces', queryRouter);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  startWorker();
  console.log('Worker running inside API process');
});