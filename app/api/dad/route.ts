export const runtime = "edge";

import { NextRequest } from "next/server";
import { checkDadStream } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const claim: string = body.claim ?? "";

  if (!claim.trim()) {
    return Response.json({ error: "请输入那句话" }, { status: 400 });
  }

  if (claim.length > 500) {
    return Response.json({ error: "太长了，精简一下" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );

      try {
        for await (const event of checkDadStream(claim.trim())) {
          send(event);
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "分析失败，请稍后重试",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
