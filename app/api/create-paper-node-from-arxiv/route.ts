import { createPaperNodeFromArxiv } from "@/lib/engine/services/paper-node-ops";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { arxivId } = await req.json();
  const paper = await createPaperNodeFromArxiv(arxivId);
  return NextResponse.json(paper?.rawPaperMetadata);
}
