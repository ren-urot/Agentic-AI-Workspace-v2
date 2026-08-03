# NexxaByte Agentic AI Solutions — Product Platform

This is the **frontend-only phase** of the NexxaByte Agentic AI Solutions product platform: a Next.js + TypeScript + Tailwind + shadcn/ui enterprise dashboard running entirely on mock data.

## Important: this is a demo, not a working backend

- All data under `src/lib/mock-data/` is fabricated and served with an artificial delay to simulate network latency. There is no database.
- Authentication (`src/lib/auth.ts`, `src/app/login/actions.ts`) is a **plaintext-cookie mock** with no real credential verification, hashing, or session security. **It must not ship as-is** to production.
- All "integrations," AI agent behavior, and RAG/knowledge-base search are **UI-only simulations**. There is no real backend, LLM, or third-party service connected to this app.

## Development

```bash
npm install
npm run dev
```
