const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

async function generateEmbedding(text) {
  const result = await model.embedContent(text);
  return result.embedding.values; // array of numbers
}

module.exports = generateEmbedding;