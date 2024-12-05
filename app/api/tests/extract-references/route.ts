import { extractReferences } from "@/lib/engine/services/arxiv/extract-references";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { arxivLink } = await request.json();
  const references = await extractReferences(arxivLink);
  return NextResponse.json(references);
}
