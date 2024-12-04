import getConceptsFromSummary from "@/lib/engine/services/arxiv/get-concepts-from-summary";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { summary } = body;

  // Create a streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start processing in the background
  (async () => {
    try {
      // Assuming getConceptsFromSummary is an async generator
      const generator = getConceptsFromSummary(summary);

      for await (const update of generator) {
        // Write each update to the stream
        if (Array.isArray(update)) {
          const arrayOfNumberOfNeighbors = update.map(
            (node) => node.neighbors.length
          );
          await writer.write(
            `num neighbors array: ${JSON.stringify(
              arrayOfNumberOfNeighbors
            )}\n\n`
          );
          // await writer.write(`final: ${JSON.stringify(update)}\n\n`);
        } else {
          await writer.write(`data: ${JSON.stringify(update)}\n\n`);
        }
      }
    } finally {
      writer.close();
    }
  })();

  // Return a streaming response
  return new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
