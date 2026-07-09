const IORedis = require('ioredis');

const connection = new IORedis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null
});

module.exports = connection;