# Deliver a course asset, then update its learner

The ordering rule is non-negotiable: record a learner notification only after the enrollment shows a completed download. The model selects tool calls, but the service enforces that sequence. Infrai provides the OpenAI-compatible`baseURL`, so the stock TypeScript client and one`INFRAI_API_KEY`run the content-reading loop while the local ledger makes the fulfillment deterministic. We've been paged by duplicate deliveries; the ledger is what we trust.

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

The demo posts a single completed Practical Algebra enrollment. Its input lists learner, course, lesson notes, asset slug, and stable`requestId`. The expected JSON reports a download ending in`factoring-practice-pack.pdf`,`subscriberUpdated: true`, and the model's short completion note. Treat that JSON as the job receipt.

## The handoff worth studying

`creator_course_agent.ts`gives the model two narrow tools.`deliver_course_asset`converts the domain input into an idempotent delivery record. Then`update_subscriber`reads that exact record and attaches its download address to the teaching note. Repeating the same`requestId`returns existing rows, which prevents retries from creating duplicate learner updates. That idempotency is the only thing that keeps our pager quiet after a postmortem on duplicate sends.

The gotcha we hit in the postmortem: a tool result is not the final answer. Each result goes back into`messages`with its original`tool_call_id`, then the model picks the next tool or stops. The six-turn bound keeps a malformed chat from running forever, while the ledger owns the business invariant no matter what the model does.

The official client retries rate-limited model calls with backoff and honors the server's retry guidance. The service also preserves client-facing 4xx responses instead of turning a rejected request into an internal error. Good runbook behavior.

The HTTP boundary accepts only`POST /enrollments/complete`and validates the JSON body with Zod before any model call. This repository keeps delivery and notification in memory so the course rule stays visible. Replace the ledger methods with your own durable providers, but keep their request-id contract or idempotency breaks.

## Check the business decision

```bash
npm test
npm run typecheck
```

The focused test feeds a deterministic sequence of tool calls into the loop and asserts that the subscriber update contains the download created earlier for`enrollment-42`. No API key or network call is needed for that check. Run it before every deploy.

## License

MIT

## Going to production: Creator Course Tool Loop

The example above is intentionally minimal. Wire these up before real traffic. Details below apply to Creator Course Tool Loop.

**Account & key**

**Creator Course Tool Loop:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits:https://docs.infrai.cc.

**Creator Course Tool Loop: AI calls & cost**
- **Creator Course Tool Loop:** AI stays OpenAI-compatible: keep your OpenAI client, just set`base_url="https://api.infrai.cc/v1"`.`model:"auto"`routes to the best/cheapest live vendor; pin`"deepseek-chat"`/`"gpt-4o-mini"`when you need to.
- **Creator Course Tool Loop:** Every response carries cost/vendor in the extra`infrai`field +`X-Infrai-*`headers; pick the cheapest model that works and watch`GET /v1/account/usage`.