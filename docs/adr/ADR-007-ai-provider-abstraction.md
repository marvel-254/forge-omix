# ADR-007 — AI Provider Abstraction

## Status: ACCEPTED

## Context

The AI layer must work with multiple providers (OpenRouter, Ollama, local models, etc.) without hard-coding to any one. Users may want to use local models for privacy, cheap APIs for cost, or multiple providers for fallback.

## Options

| Approach | Pros | Cons |
|----------|------|------|
| OpenAI SDK compatible | Broad provider support | Assumes OpenAI API shape |
| Custom abstraction (chosen) | Full control, any provider | More code |
| Vercel AI SDK | Multi-provider, streaming | Opinionated, React-focused |

## Evaluation**

**Custom abstraction:**
- Provider interface with `chat()`, `stream()`, `embed()` methods
- OpenRouter implementation (covers 200+ models)
- Ollama implementation (local fallback)
- Easy to add more (Anthropic direct, Google direct, etc.)
- No assumptions about API shape
- Streaming via Server-Sent Events (SSE)

**Why not Vercel AI SDK:**
- Tightly coupled to React/Next.js patterns
- Opinionated about message format
- Adds dependencies we don't need

## Decision

**Custom provider abstraction** with OpenRouter and Ollama implementations. SSE for streaming.

## Consequences

- Positive: Provider-agnostic
- Positive: Local-first capable (Ollama)
- Positive: No vendor lock-in
- Negative: More code to maintain
- Negative: Must handle provider quirks manually
