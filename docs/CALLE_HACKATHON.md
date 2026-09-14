# BeforeYouSign + CALL-E

## Hackathon extension

BeforeYouSign existed before the CALL-E submission period as a residential lease analysis tool. For **CALL-E: Your Code Is Calling**, the project is being significantly extended with a phone-action workflow that turns unresolved lease questions into a real outbound call to the leasing office.

The new workflow is intentionally narrow: it is for **factual lease clarification**, not negotiation or legal advice.

## Problem

A lease analyzer can identify unclear fees, notice requirements, renewal language, utility responsibilities, and other questions a renter should resolve before signing. The remaining work is often offline: the renter has to call a leasing office, explain each question, take notes, and reconcile the answers with the document.

The CALL-E extension closes that gap.

## Workflow

1. Analyze a lease in BeforeYouSign.
2. Review the generated questions and unresolved items.
3. Open **Call leasing office**.
4. Enter the leasing office number and the factual questions to ask.
5. Explicitly confirm that a real outbound call should be placed.
6. The server sends the phone task to CALL-E.
7. CALL-E identifies itself as an automated assistant, asks only the supplied questions, and returns a structured outcome.
8. The renter reviews the answers and any unresolved follow-up before signing.

## New CALL-E components

- `src/app/call-agent/page.tsx` — dedicated renter-facing phone workflow.
- `src/components/beforeyousign/call-agent-client.tsx` — question editor, real-call confirmation, task creation, result polling, and structured result display.
- `src/app/api/call-landlord/route.ts` — server-only CALL-E integration using `POST /v1/calls` and `GET /v1/calls/{call_id}`.
- Navigation entry from the existing BeforeYouSign interface.
- Server-only `CALLE_API_KEY` and optional `CALLE_BASE_URL` configuration.

## Safety boundaries

The task sent to CALL-E instructs the agent to:

- identify itself as an automated assistant calling on behalf of a renter;
- ask only the renter-provided factual questions;
- avoid negotiation, threats, legal advice, or impersonation;
- avoid agreeing to new terms;
- mark unanswered questions as unresolved;
- stop and request human follow-up if the leasing office wants to speak directly with the renter.

Before a call can be created, the UI requires an explicit confirmation that the user wants a real outbound call and is authorized to request it.

## Local setup

Add the following server-side environment variables:

```env
CALLE_API_KEY=your_call_e_api_key
CALLE_BASE_URL=https://api.heycall-e.com
```

Do not expose `CALLE_API_KEY` through a `NEXT_PUBLIC_*` variable.

Then run:

```bash
npm install
npm run dev
```

Open `/call-agent` and use an E.164 number such as `+19035551234`.

## Demo path

For the hackathon video, the shortest complete demonstration is:

1. Run BeforeYouSign on a sample lease.
2. Show the generated lease questions / ambiguity findings.
3. Open **Call leasing office**.
4. Use a controlled test number and place a CALL-E call.
5. Show the live task status and final structured result.
6. Explain that the update turns passive lease analysis into an action loop that resolves real-world questions by phone.

## Hackathon positioning

Primary use case: **Workflow & back-office automation** (consumer-facing lease clarification workflow).

One-sentence task description:

> BeforeYouSign analyzes a residential lease, then uses CALL-E to call the leasing office and resolve the renter's specific unanswered lease questions before signing.
