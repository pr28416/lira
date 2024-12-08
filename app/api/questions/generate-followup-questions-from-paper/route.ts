import { NextRequest, NextResponse } from "next/server";
import { generateAiFollowUpQuestionsFromPaperAndQuestions } from "@/lib/engine/services/nodes/question-node-ops";

export async function POST(req: NextRequest) {
  const {
    paperSummary,
    questions,
  }: { paperSummary: string; questions: string[] } = await req.json();
  const followUpQuestions =
    await generateAiFollowUpQuestionsFromPaperAndQuestions(
      paperSummary,
      questions
    );
  return NextResponse.json(followUpQuestions);
}
