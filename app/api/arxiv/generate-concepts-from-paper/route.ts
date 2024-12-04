import { NextRequest, NextResponse } from "next/server";
import getConceptsFromSummary from "@/lib/engine/services/arxiv/get-concepts-from-summary";

export async function POST(request: NextRequest) {
  const { summary } = await request.json();

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    try {
      const generator = getConceptsFromSummary(summary);

      for await (const update of generator) {
        // Write the JSON update directly to the stream
        console.log("Writing update", JSON.stringify(update));
        await writer.write(`${JSON.stringify(update)}\n`);
      }
    } finally {
      writer.close();
    }
  })();

  return new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
