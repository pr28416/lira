import { NextRequest, NextResponse } from "next/server";
import { aiSearchArxiv } from "@/lib/engine/services/ai-search-arxiv";
import { createPaperNodeFromUrl } from "@/lib/engine/services/paper-node-ops";
export async function POST(request: NextRequest) {
  const { query, maxResults } = await request.json();
  const arxivLinks = await aiSearchArxiv(query, maxResults);
  console.log("arxivLinks", arxivLinks);
  const paperNodes = await Promise.all(
    arxivLinks.map((link) => createPaperNodeFromUrl(link))
  );
  const paperMetadata = paperNodes.map(
    (node) => node?.rawPaperMetadata || null
  );
  return NextResponse.json({ paperMetadata });
}
