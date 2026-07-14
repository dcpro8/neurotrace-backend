require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./db');
const ingestRouter = require('./routes/ingest');
const queryRouter = require('./routes/query');
const askRouter = require('./routes/ask');
const startWorker = require('./worker');
const statsRouter = require('./routes/stats');
const streamRouter = require('./routes/stream');
const tracesListRouter = require('./routes/traces');
const { askLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/traces/ask', askLimiter);
app.use('/traces/query', askLimiter);

app.use('/traces', ingestRouter);
app.use('/traces', queryRouter);
app.use('/traces', askRouter);

app.use('/traces', streamRouter);

app.use('/traces', statsRouter);
app.use('/traces/all', tracesListRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  startWorker();
  console.log('Worker running inside API process');
});