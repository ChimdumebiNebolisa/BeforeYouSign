# Use process-local guardrails for the controlled AI demo

**Status:** Accepted — 2026-10-03

BeforeYouSign is currently an access-restricted, low-volume demonstration rather than an unrestricted public service. The application therefore combines hosting-layer access protection with process-local controls: at most five analysis attempts per trusted client in ten minutes, at most thirty attempts per server instance per hour, four concurrent analyses globally, and one concurrent analysis per trusted client. Rate-limit responses use the existing `rate_limited` error shape and include a computed `Retry-After` value.

This avoids adding accounts, a database, or a distributed rate-limit service solely for the demo. The limits reset when an instance restarts and do not coordinate across instances, so they are not sufficient for a public launch. If hosting-layer access protection is unavailable, AI analysis must remain disabled on the public deployment and may be enabled only on a protected preview.

The OpenAI credential must belong to a dedicated project, remain in deployment secrets, and be monitored by project and API key through the OpenAI Usage API. A public launch requires a shared durable limiter or equivalent edge enforcement, an explicit spend-control design, and a new review of these assumptions.

Production dependency audit failures remain release-blocking. The five high-severity advisories currently reported only through the ESLint development toolchain are accepted temporarily because npm's proposed remediation downgrades the Next.js-aligned lint package. They must be reassessed when compatible upstream releases are available; this exception does not cover production dependencies.
