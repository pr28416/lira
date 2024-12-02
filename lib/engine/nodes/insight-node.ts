import { GenericNode } from "./generic-node";
import { NodeType } from "../types";

export class InsightNode extends GenericNode {
  conclusion: string;

  constructor(conclusion: string) {
    super(NodeType.INSIGHT);
    this.conclusion = conclusion;
  }
}
