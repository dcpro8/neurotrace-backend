function requireApiKey(req, res, next) {
  if (req.headers['x-api-key'] !== process.env.INGEST_API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

module.exports = requireApiKey;