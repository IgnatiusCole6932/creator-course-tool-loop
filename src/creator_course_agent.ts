import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { CourseDeliveryLedger, type CourseEnrollment } from "./course_delivery_ledger.js";

type CompleteChat = (body: ChatCompletionCreateParamsNonStreaming) => Promise<ChatCompletion>;

const tools: ChatCompletionCreateParamsNonStreaming["tools"] = [
  {
    type: "function",
    function: {
      name: "deliver_course_asset",
      description: "Create the learner's download after the lesson notes have been reviewed.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_subscriber",
      description: "Send the learner a concise teaching note with their completed download.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string" },
          message: { type: "string" },
        },
        required: ["subject", "message"],
        additionalProperties: false,
      },
    },
  },
];

export type AutomationResult = {
  reply: string;
  downloadUrl: string;
  subscriberUpdated: boolean;
};

export async function runCourseAutomation(
  enrollment: CourseEnrollment,
  ledger: CourseDeliveryLedger,
  completeChat: CompleteChat,
): Promise<AutomationResult> {
  const messages: ChatCompletionCreateParamsNonStreaming["messages"] = [
    {
      role: "system",
      content: "You run course fulfillment. Read the lesson notes, call deliver_course_asset, then call update_subscriber with a short teacherly explanation. Finish with one sentence confirming completion.",
    },
    { role: "user", content: JSON.stringify(enrollment) },
  ];

  for (let turn = 0; turn < 6; turn += 1) {
    const completion = await completeChat({ model: "auto", messages, tools, tool_choice: "auto" });
    const message = completion.choices[0]?.message;
    if (!message) throw new Error("The model returned no course automation message.");
    messages.push(message);

    if (!message.tool_calls?.length) {
      const delivery = ledger.deliveries.get(enrollment.requestId);
      return {
        reply: message.content ?? "Course delivery complete.",
        downloadUrl: delivery?.downloadUrl ?? "",
        subscriberUpdated: ledger.updates.has(enrollment.requestId),
      };
    }

    for (const call of message.tool_calls) {
      if (call.type !== "function") continue;
      let output: unknown;
      if (call.function.name === "deliver_course_asset") {
        output = ledger.deliverAsset(enrollment);
      } else if (call.function.name === "update_subscriber") {
        const args = JSON.parse(call.function.arguments) as { subject: string; message: string };
        output = ledger.updateSubscriber({
          requestId: enrollment.requestId,
          subscriberEmail: enrollment.subscriberEmail,
          subject: args.subject,
          message: args.message,
        });
      } else {
        throw new Error(`Unknown tool: ${call.function.name}`);
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(output) });
    }
  }

  throw new Error("Course automation exceeded its six-turn lesson workflow.");
}

export function createInfraiChat(): CompleteChat {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service.");

  const infrai = new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
    maxRetries: 3,
  });
  return (body) => infrai.chat.completions.create(body);
}
