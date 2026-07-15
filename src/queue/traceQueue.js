const { Queue } = require('bullmq');
const connection = require('./connection');

const traceQueue = new Queue('trace-ingestion', { connection });

module.exports = traceQueue;