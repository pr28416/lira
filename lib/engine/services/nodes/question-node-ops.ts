import { openai } from "@/lib/ai/openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";

const questionSchema = z.object({
  questions: z.array(z.string()),
});

export async function generateAiFollowUpQuestions(
  question: string,
  numberOfQuestions: number
) {
  // Optimization to have GPT plan out better follow-up questions
  const unstructuredResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `First come up with a few interesting things that could be interesting to explore as part of the question. Plan ahead. Accordingly, at the end of your response, generate ${numberOfQuestions} follow-up questions based on the given question. The question is: ${question}`,
      },
    ],
  });
  const unstructuredResponseText =
    unstructuredResponse.choices[0].message.content;
  const response = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Given a response from an AI model about possible follow-up questions to a single question that are listed at the end of the response, extract the questions into a structured list of questions. Previous response:\n\n${unstructuredResponseText}`,
      },
    ],
    response_format: zodResponseFormat(questionSchema, "questions"),
  });

  // Extract the questions from the response
  return response.choices[0].message.parsed?.questions || [];
}

export async function generateAiFollowUpQuestionsFromPaperAndQuestions(
  paperSummary: string,
  questions: string[]
) {
  const unstructuredResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Given this paper summary: "${paperSummary}"

And these existing questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

First analyze the paper summary and existing questions to identify gaps and interesting angles that haven't been explored yet. Then generate 3-5 follow-up questions that would help expand past the current questions using an understanding of the paper while avoiding redundancy with the existing questions. Include both questions that are specific to concepts in the paper and questions that are more general.`,
      },
    ],
  });
  const unstructuredResponseText =
    unstructuredResponse.choices[0].message.content;
  const response = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Extract just the follow-up questions from this response into a structured list: \n\n${unstructuredResponseText}`,
      },
    ],
    response_format: zodResponseFormat(questionSchema, "questions"),
  });

  return response.choices[0].message.parsed?.questions || [];
}
