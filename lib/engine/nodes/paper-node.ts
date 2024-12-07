import { GenericNode } from "./generic-node";
import { NodeType, PaperMetadata } from "../types";

export class PaperNode extends GenericNode {
  rawPaperMetadata: PaperMetadata | null;
  aiSummary: string | null;
  citedUrls: string[];
  citedArxivPapers: PaperMetadata[];
  notes: string;

  constructor(rawPaperMetadata: PaperMetadata) {
    super(NodeType.PAPER);
    this.rawPaperMetadata = rawPaperMetadata;
    this.aiSummary = null;
    this.citedUrls = [];
    this.citedArxivPapers = [];
    this.notes = "";
  }

  getAiStringDescription(): string {
    return `Paper ID: ${this.id || ""}\nPaper: ${
      this.rawPaperMetadata?.title || ""
    }\nAbstract: ${this.rawPaperMetadata?.abstract || ""}`;
  }

  getAiSummary(): string | null {
    return this.aiSummary;
  }

  setAiSummary(summary: string) {
    this.aiSummary = summary;
  }
}
