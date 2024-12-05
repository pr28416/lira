import { NextRequest } from "next/server";

import { getPaginatedPDFTextFromArxivLink } from "@/lib/engine/services/arxiv/get-raw-pdf-text-from-arxiv";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { arxivLink } = await request.json();
  const pageTexts = await getPaginatedPDFTextFromArxivLink(arxivLink);
  return NextResponse.json(pageTexts);
}
