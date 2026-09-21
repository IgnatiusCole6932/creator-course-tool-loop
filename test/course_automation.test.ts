import assert from "node:assert/strict";
import test from "node:test";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { CourseDeliveryLedger } from "../src/course_delivery_ledger.js";
import { runCourseAutomation } from "../src/creator_course_agent.js";

test("a subscriber update receives the download created earlier in the same enrollment", async () => {
  const replies = [
    {
      choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "delivery-1", type: "function", function: { name: "deliver_course_asset", arguments: "{}" } }] } }],
    },
    {
      choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "update-1", type: "function", function: { name: "update_subscriber", arguments: JSON.stringify({ subject: "Your factoring practice", message: "Use the worked example before attempting each exercise." }) } }] } }],
    },
    { choices: [{ message: { role: "assistant", content: "The practice pack is delivered and the learner has been updated." } }] },
  ] as ChatCompletion[];
  const ledger = new CourseDeliveryLedger();

  const result = await runCourseAutomation(
    {
      requestId: "enrollment-42",
      subscriberEmail: "mina@example.com",
      subscriberName: "Mina",
      courseTitle: "Practical Algebra",
      assetSlug: "factoring-pack.pdf",
      lessonNotes: "Mina completed the factoring lesson and is ready for targeted independent practice.",
    },
    ledger,
    async () => {
      const reply = replies.shift();
      assert.ok(reply);
      return reply;
    },
  );

  const update = ledger.updates.get("enrollment-42");
  assert.equal(result.subscriberUpdated, true);
  assert.equal(update?.downloadUrl, result.downloadUrl);
  assert.match(result.downloadUrl, /factoring-pack\.pdf$/);
});
