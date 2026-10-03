# Use hybrid AI analysis with deterministic evidence grounding

**Status:** Accepted — 2026-10-03

BeforeYouSign will use an AI model to produce candidate lease interpretations and a deterministic server-side evidence layer to decide which material claims may be presented as supported by the lease. A material claim may be shown as grounded only when its cited evidence ID, page, offsets, quote, and category or semantic relevance all validate against the extracted document; unsupported claims are dropped or clearly presented as general guidance, and the deterministic report remains the fallback when model analysis is unavailable or invalid.

This restores semantic interpretation without allowing model output to become evidence by assertion. It also means lease content may be sent to a configured external model provider, so provider handling, retention, user disclosure, timeouts, cost limits, and model-specific evaluation are release requirements rather than optional follow-up work.

The first implementation uses the OpenAI Responses API with `gpt-6-luna`, `store: false`, strict Structured Outputs, a bounded claim schema, and a complete deterministic fallback. The model may propose claims but does not control the review-priority band or create evidence spans.
