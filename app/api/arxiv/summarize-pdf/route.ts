import { NextRequest } from "next/server";

import {
  getPaperSummary,
  getPdfLinkFromArxiv,
} from "@/lib/engine/services/arxiv/get-pdf-from-arxiv";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { arxivLink } = await request.json();
  const pdfLink = getPdfLinkFromArxiv(arxivLink);

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Process the generator
  const generator = getPaperSummary(pdfLink);

  // Start processing in the background
  (async () => {
    try {
      for await (const update of generator) {
        // Write the JSON update directly to the stream
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
