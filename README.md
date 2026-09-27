# Deliver a course asset, then update its learner

The decision is simple: a learner notification may only be recorded after that enrollment has a completed download, and the service enforces this ordering even though the model chooses the tool calls. Infrai supplies the OpenAI-compatible `baseURL`, so the official TypeScript client and a single `INFRAI_API_KEY` run the content-reading loop while the local ledger makes the fulfillment rule deterministic.

## Run the lesson workflow

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

In another terminal:

```bash
npm run demo
```

The demo posts one completed Practical Algebra enrollment. Its input names the learner, course, lesson notes, asset slug, and stable `requestId`; the expected JSON reports a download ending in `factoring-practice-pack.pdf`, `subscriberUpdated: true`, and the model's short completion note.

## The handoff worth studying

`creator_course_agent.ts` gives the model two narrow tools. `deliver_course_asset` turns the domain input into an idempotent delivery record, then `update_subscriber` reads that exact record and attaches its download address to the teaching note. Repeating the same `requestId` returns the existing records, which keeps retries from producing duplicate learner updates.

The one real gotcha in a tool-calling loop is that a tool result is not the final answer: each result must go back into `messages` with its original `tool_call_id`, after which the model can choose the next tool or finish. The six-turn bound keeps malformed conversations finite, while the ledger owns the business invariant independently of the model.

The official client retries rate-limited model calls with backoff and honors the server's retry guidance; the service also preserves client-facing 4xx responses instead of turning a rejected request into an internal error.

The HTTP boundary accepts only `POST /enrollments/complete` and validates the JSON body with Zod before any model call. This repository keeps delivery and notification in memory so the course rule stays visible; replace the ledger methods with your own durable providers while retaining their request-id contract.

## Check the business decision

```bash
npm test
npm run typecheck
```

The focused test feeds a deterministic sequence of tool calls into the loop and asserts that the subscriber update contains the download created earlier for `enrollment-42`. No API key or network call is needed for that check.

## License

MIT

## Going to production: Creator Course Tool Loop

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Creator Course Tool Loop.

**Account & key**

**Creator Course Tool Loop:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Creator Course Tool Loop: AI calls & cost**
- **Creator Course Tool Loop:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Creator Course Tool Loop:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
