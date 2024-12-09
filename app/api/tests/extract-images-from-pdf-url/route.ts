import { NextRequest, NextResponse } from "next/server";
import { extractImagesFromPdfUrl } from "@/lib/engine/services/pdf/pdf-image-ops";

export async function POST(req: NextRequest) {
  const { pdfUrl } = await req.json();
  const images = await extractImagesFromPdfUrl(pdfUrl);
  return NextResponse.json(images);
}
