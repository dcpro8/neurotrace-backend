require('dotenv').config();
const express = require('express');
const connectDB = require('./db');

const app = express();
app.use(express.json());

const ingestRouter = require('./routes/ingest');
app.use('/traces', ingestRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});