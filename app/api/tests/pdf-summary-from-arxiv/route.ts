import { NextRequest } from "next/server";

import {
  getPaperSummary,
  getPdfLinkFromArxiv,
} from "@/lib/engine/services/arxiv/get-pdf-from-arxiv";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { arxivLink } = await request.json();
  const pdfLink = getPdfLinkFromArxiv(arxivLink);

  // Create a streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Process the generator
  const generator = getPaperSummary(pdfLink);

  // Start processing in the background
  (async () => {
    try {
      for await (const update of generator) {
        // Write each update to the stream
        if ("progress" in update) {
          await writer.write(`data: ${JSON.stringify(update)}\n\n`);
        } else if ("summaryChunk" in update) {
          await writer.write(update.summaryChunk);
        } else {
          await writer.write(`\n\nfinal: ${JSON.stringify(update)}\n\n`);
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
