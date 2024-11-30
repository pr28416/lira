import { openai } from "@/lib/ai/openai";
import { GenericNode } from "./generic-node";
import { NodeType } from "../types";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";

const questionSchema = z.object({
  questions: z.array(z.string()),
});

export class QuestionNode extends GenericNode {
  question: string;

  aiFollowUpQuestions: string[];

  constructor(question: string) {
    super(NodeType.QUESTION);
    this.question = question;
    this.aiFollowUpQuestions = [];
  }

  setQuestion(question: string) {
    this.question = question;
  }

  getAiStringDescription(): string {
    return `Question ID: ${this.id || ""}\nQuestion: ${this.question}`;
  }

  async generateAiFollowUpQuestions(numberOfQuestions: number) {
    this.aiFollowUpQuestions = [];

    // Optimization to have GPT plan out better follow-up questions
    const unstructuredResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `First come up with a few interesting things that could be interesting to explore as part of the question. Plan ahead. Accordingly, at the end of your response, generate ${numberOfQuestions} follow-up questions based on the given question. The question is: ${this.question}`,
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
    this.aiFollowUpQuestions =
      response.choices[0].message.parsed?.questions || [];
  }
}
