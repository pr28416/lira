import { GenericNode } from "./generic-node";
import { NodeType } from "../types";

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

  resetFollowUpQuestions() {
    this.aiFollowUpQuestions = [];
  }
}
