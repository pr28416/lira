import { GenericNode } from "./generic-node";
import { NodeType, PaperMetadata } from "../types";

export class PaperNode extends GenericNode {
  rawPaperMetadata: PaperMetadata | null;

  constructor(rawPaperMetadata: PaperMetadata) {
    super(NodeType.PAPER);
    this.rawPaperMetadata = rawPaperMetadata;
  }

  getAiStringDescription(): string {
    return `Paper ID: ${this.id || ""}\nPaper: ${
      this.rawPaperMetadata?.title || ""
    }\nAbstract: ${this.rawPaperMetadata?.abstract || ""}`;
  }
}
