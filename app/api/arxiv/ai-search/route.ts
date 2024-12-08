import { NextRequest, NextResponse } from "next/server";
import {
  aiSearchArxiv,
  getAiSearchQuery,
} from "@/lib/engine/services/arxiv/ai-search-arxiv";
import { createPaperNodeFromUrl } from "@/lib/engine/services/nodes/paper-node-ops";
import { PaperMetadata } from "@/lib/engine/types";
import {
  AiSearchArxivResponse,
  AiSearchArxivProgressResponse,
} from "@/lib/engine/services/arxiv/types";

export async function POST(request: NextRequest) {
  const { query, maxResults } = await request.json();
  let paperMetadata: PaperMetadata[] = [];
  const MAX_ATTEMPTS = 3;

  // Create streaming infrastructure
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Process in background
  (async () => {
    try {
      for (
        let attempts = 0;
        attempts < MAX_ATTEMPTS && paperMetadata.length < maxResults;
        attempts++
      ) {
        const modifiedQuery = await getAiSearchQuery(query);

        // Send progress update before search
        const progressUpdate: AiSearchArxivProgressResponse = {
          attemptNumber: attempts + 1,
          nextAiSearchQuery: modifiedQuery ?? query,
          totalPapersFound: paperMetadata.length,
        };
        await writer.write(`${JSON.stringify(progressUpdate)}\n`);

        const arxivLinks = await aiSearchArxiv(
          modifiedQuery ?? query,
          maxResults,
          false
        );
        const paperNodes = await Promise.all(
          arxivLinks.map((link) => createPaperNodeFromUrl(link))
        );

        const newMetadata = paperNodes
          .map((node) => node?.rawPaperMetadata || null)
          .filter((metadata) => metadata !== null);

        paperMetadata = [...new Set([...paperMetadata, ...newMetadata])];
      }

      // Send final results
      const finalResponse: AiSearchArxivResponse = {
        paperMetadata: paperMetadata.slice(0, maxResults),
      };
      await writer.write(`${JSON.stringify(finalResponse)}\n`);
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
