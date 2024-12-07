import { GenericNode } from "./generic-node";
import { NodeType, PaperMetadata } from "../types";

export class QuestionNode extends GenericNode {
  question: string;
  aiFollowUpQuestions: string[];
  searchedPapers: PaperMetadata[];

  constructor(question: string) {
    super(NodeType.QUESTION);
    this.question = question;
    this.aiFollowUpQuestions = [];
    this.searchedPapers = [];
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
