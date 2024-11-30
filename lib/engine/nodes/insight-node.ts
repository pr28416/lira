import { GenericNode } from "./generic-node";
import { NodeType } from "../types";

export class InsightNode extends GenericNode {
  conclusion: string;

  constructor(label: string, description: string, conclusion: string) {
    super(label, description, NodeType.INSIGHT);
    this.conclusion = conclusion;
  }
}
