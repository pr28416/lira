import { NextRequest } from "next/server";

import { getAbstractFromArxivPaper } from "@/lib/engine/services/get-abstract-from-paper";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  const abstract = await getAbstractFromArxivPaper(url);
  return NextResponse.json({ abstract });
}
