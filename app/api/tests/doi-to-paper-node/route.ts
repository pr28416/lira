import { createPaperNodeFromUrl } from "@/lib/engine/nodes/paper-node";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  const paperNode = await createPaperNodeFromUrl(url);
  if (!paperNode) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  return NextResponse.json({
    paperMetadata: paperNode.rawPaperMetadata,
  });
}
