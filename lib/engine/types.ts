import { Node } from "@xyflow/react";
import { GenericNode } from "./nodes/generic-node";

export enum NodeType {
  QUESTION = "Question",
  PAPER = "Paper",
  CONCEPT = "Concept",
  INSIGHT = "Insight",
}

export interface PaperMetadata {
  title: string;
  abstract?: string;
  authors?: string[];
  DOI: string;
  URL: string;
  publishDate?: Date;
  keywords?: string[];
}

export type FlowNodeData = { node: GenericNode };
export type FlowNode = Node<FlowNodeData, "flowNode">;
