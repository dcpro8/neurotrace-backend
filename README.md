# NeuroTrace — Backend

**Agent observability + RAG debugger.** Ask why an AI agent did what it did, in plain English — instead of manually digging through logs.

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=flat&logoColor=white)
![Status](https://img.shields.io/badge/status-backend%20complete-brightgreen)

---

## The problem

As agentic AI spreads into CI/CD bots, deploy agents, and coding agents, a real gap has opened up: when an agent fails, there's no efficient way to find out *why*. The current answer is manually scrolling through thousands of lines of logs trying to reconstruct what the agent was "thinking."

This isn't a niche problem — the LLM/agent observability market is valued at **$2.69B in 2026**, and companies like LangSmith and Langfuse exist specifically to solve it. NeuroTrace is a lightweight version of that category, with a RAG-native twist: instead of clicking through a trace viewer, you **ask a question in plain English** and get a grounded answer with citations back to the exact step that caused the failure.

## What it does

1. **Records** every step an AI agent takes — reasoning, tool calls, tool results, errors — as a structured trace
2. **Chunks and embeds** each trace so it's searchable by *meaning*, not just keyword
3. **Retrieves** the most relevant trace segments for a given question using vector similarity search
4. **Generates** a plain-English answer grounded in that retrieved context, with citations back to exact step ranges — never inventing an answer the data doesn't support

## Architecture

**Ingestion pipeline** (write path):
```
AI agent runs a task
      │
      ▼
Instrumentation → Ingestion API (Express, auth required)
      │
      ▼
Redis + BullMQ queue
      │
      ▼
Worker: chunk + embed (Gemini)
      │
      ▼
MongoDB Atlas (trace store + vector index)
```

**Query pipeline** (read path — the actual RAG loop):
```
User question
      │
      ▼
Embed the question (Gemini)
      │
      ▼
Vector search (MongoDB Atlas, top-k trace chunks)
      │
      ▼
Groq generates answer, grounded in retrieved context
      │
      ▼
Answer + citations back to exact trace steps
```

## Tech stack

| Layer | Technology |
|---|---|
| Runtime / API | Node.js, Express |
| Queue | Redis (Upstash), BullMQ |
| Database + vector store | MongoDB Atlas (Atlas Vector Search) |
| Embeddings | Google Gemini Embedding API |
| Generation | Groq (Llama 3.3 70B) |
| Security | Helmet, CORS, rate limiting, API-key-gated ingestion, input validation |

## API reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/traces/ingest` | `x-api-key` header | Submit a new agent trace for processing |
| `POST` | `/traces/query` | none (rate-limited) | Raw vector search — returns top-k matching chunks + similarity scores |
| `POST` | `/traces/ask` | none (rate-limited) | Full RAG loop — returns a grounded natural-language answer with citations |
| `GET` | `/health` | none | Health check |

### Example — `/traces/ask`

**Request**
```bash
curl -X POST https://<your-deployed-url>/traces/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "why did the deploy agent fail"}'
```

**Response**
```json
{
  "question": "why did the deploy agent fail",
  "answer": "The deploy agent failed due to a GitHub API timeout after 3 retries [steps 0-2]. This issue occurred consistently across multiple attempts [steps 0-2]. There is no indication that the agent was able to successfully check the deploy status, as the timeout error prevented it from completing its task.",
  "citations": [
    { "traceId": "6a50c27abf688ad1f06abf12", "stepRange": { "start": 0, "end": 2 }, "score": 0.8304 }
  ]
}
```

## Retrieval quality

A quick sanity check on retrieval discrimination — asking *"why did the deploy agent fail"* against three unrelated traces:

| Trace | Relevance to question | Similarity score |
|---|---|---|
| deploy-agent (GitHub timeout) | Directly relevant | **0.830** |
| blueprint-agent (schema retry) | Unrelated | 0.796 |
| pr-review-agent (clean approval) | Unrelated | 0.778 |

The score gap confirms retrieval is discriminating on *meaning*, not just keyword overlap — the correct trace consistently ranks highest.

## Getting started

```bash
git clone https://github.com/dcpro8/neurotrace-backend.git
cd neurotrace-backend
npm install
```

Create a `.env` file:
```
MONGODB_URI=
GEMINI_API_KEY=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
UPSTASH_REDIS_URL=
INGEST_API_KEY=
ALLOWED_ORIGIN=http://localhost:5173
PORT=4000
```

Run it:
```bash
npm start
```
This starts both the API server and the BullMQ worker in a single process (deployment-friendly for free-tier hosting).

## Security notes

- Ingestion endpoint requires an API key; ask/query endpoints are public but rate-limited (20 requests / 15 min per IP)
- Input validation on all incoming trace data (step count, type enum, content length) to reduce prompt-injection surface
- Helmet + CORS configured; secrets never committed (`.env` git-ignored)
- **Known tradeoff**: MongoDB Atlas Network Access is set to allow all IPs (`0.0.0.0/0`), since free-tier hosting doesn't provide a static outbound IP to whitelist. A production deployment would use a static egress IP or VPC peering instead.

## Roadmap

- [x] Trace schema + MongoDB setup
- [x] Ingestion API + BullMQ queue
- [x] Chunking + Gemini embeddings
- [x] Atlas Vector Search + retrieval endpoint
- [x] Groq-grounded answer generation with citations
- [x] Rate limiting, auth, input validation, security headers
- [ ] Anomaly auto-scoring on ingested traces
- [ ] Run diffing (compare two traces of the same agent)
- [ ] Real instrumentation SDK for live production agents (currently fed by simulated traces)

## Related repositories

- [`neurotrace-dashboard`](https://github.com/dcpro8/neurotrace-dashboard) — React/TypeScript frontend
- [`neurotrace-agent-sim`](https://github.com/dcpro8/neurotrace-agent-sim) — generates realistic simulated agent traces to feed this pipeline

---

Part of a series exploring AI infrastructure tooling — see also [NeuroOps](https://github.com/dcpro8/neuroops-backend) (AI DevOps copilot) and [NeuroForge](https://github.com/dcpro8/neuroforge-frontend) (AI product blueprint generator).