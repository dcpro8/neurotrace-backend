const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateAnswer(question, chunks) {
    const context = chunks
        .map((c, i) => `[Chunk ${i + 1} | steps ${c.stepRange.start}-${c.stepRange.end} | trace ${c.traceId}]\n${c.text}`)
        .join('\n\n');

    const prompt = `You are an assistant that explains AI agent behavior based only on the trace data below. Answer the question using only this context. If the context doesn't contain a clear answer, say so plainly.

Write your answer as natural prose. When you reference specific evidence, cite it inline using only the format [steps X-Y] — for example "the agent failed due to a timeout [steps 14-17]". Never mention "chunk", "chunk number", or the context format itself in your answer.

Context:
${context}

Question: ${question}

Answer:`;

    const completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 400
    });

    return completion.choices[0].message.content;
}

module.exports = generateAnswer;