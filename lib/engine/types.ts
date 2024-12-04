import { Node } from "@xyflow/react";
import { GenericNode } from "./nodes/generic-node";
import { z } from "zod";

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

export const ConceptsSchema = z.object({
  concepts: z.array(z.string()),
});

export const ConceptConnectionsSchema = z.object({
  connections: z.array(
    z.object({
      sourceNodeId: z.string(),
      targetNodeId: z.string(),
    })
  ),
});
