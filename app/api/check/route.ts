import { NextRequest } from "next/server";
import { checkClaimStream } from "@/lib/gemini";
import type { CheckRequest } from "@/types";

export async function POST(request: NextRequest) {
  const body: CheckRequest = await request.json();

  if (!body.claim || body.claim.trim().length === 0) {
    return Response.json({ error: "请输入论点" }, { status: 400 });
  }

  if (body.claim.length > 500) {
    return Response.json({ error: "论点太长了，请精简一下" }, { status: 400 });
  }

  const claim = body.claim.trim();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );

      try {
        for await (const event of checkClaimStream(claim)) {
          send(event);
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "查证失败，请稍后重试",
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
