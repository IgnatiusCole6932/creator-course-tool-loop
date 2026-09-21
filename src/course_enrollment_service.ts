import { createServer } from "node:http";
import OpenAI from "openai";
import { z } from "zod";
import { CourseDeliveryLedger } from "./course_delivery_ledger.js";
import { createInfraiChat, runCourseAutomation } from "./creator_course_agent.js";

const enrollmentBody = z.object({
  requestId: z.string().min(1),
  subscriberEmail: z.string().email(),
  subscriberName: z.string().min(1),
  courseTitle: z.string().min(1),
  assetSlug: z.string().regex(/^[a-z0-9-]+\.pdf$/),
  lessonNotes: z.string().min(20),
}).strict();

const ledger = new CourseDeliveryLedger();
const completeChat = createInfraiChat();

createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");
  if (request.method !== "POST" || request.url !== "/enrollments/complete") {
    response.writeHead(404).end(JSON.stringify({ error: "Route not found" }));
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const parsed = enrollmentBody.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!parsed.success) {
      response.writeHead(400).end(JSON.stringify({ error: "Invalid enrollment", details: parsed.error.flatten() }));
      return;
    }

    const result = await runCourseAutomation(parsed.data, ledger, completeChat);
    response.writeHead(200).end(JSON.stringify(result));
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAI.APIError && error.status && error.status >= 400 && error.status < 500) {
      response.writeHead(error.status).end(JSON.stringify({ error: error.message }));
      return;
    }
    response.writeHead(502).end(JSON.stringify({ error: "Course automation could not be completed" }));
  }
}).listen(Number(process.env.PORT ?? 3000), () => {
  console.log("Course enrollment service listening on http://localhost:3000");
});
