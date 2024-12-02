import { connectNodes, GenericNode } from "./generic-node";
import { NodeType } from "../types";
import { z } from "zod";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

const ConceptExtractSchema = z.array(
  z.object({
    concept: z.string(),
    connectedToNodesWithIds: z.array(z.string()),
  })
);

export class ConceptNode extends GenericNode {
  description: string;

  constructor(description: string) {
    super(NodeType.CONCEPT);
    this.description = description;
  }

  setDescription(description: string) {
    this.description = description;
  }

  getAiStringDescription(): string {
    return `Concept ID: ${this.id || ""}\nConcept: ${this.description}`;
  }
}

export async function aiGenerateConceptNodesFromNodes(
  nodes: GenericNode[]
): Promise<ConceptNode[]> {
  const openai = new OpenAI();

  // First, get unstructured concepts
  const nodeDescriptions = nodes
    .map((n) => `Node ${n.id}: ${n.getAiStringDescription()}`)
    .join("\n");

  const unstructuredResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Extract common concepts from these nodes and explain which nodes they relate to, by referencing the node IDs. Provide reasoning for what you extracted before you list the final concepts and their connections.",
      },
      {
        role: "user",
        content: nodeDescriptions,
      },
    ],
  });

  const unstructuredResponseText =
    unstructuredResponse.choices[0].message.content;
  if (!unstructuredResponseText) {
    throw new Error("Failed to extract concepts from nodes");
  }

  // Then, get structured concepts with node connections
  const structuredResponse = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Based on the previous concept extraction, provide a structured output of concepts and their connected node IDs.",
      },
      {
        role: "user",
        content: unstructuredResponseText,
      },
    ],
    response_format: zodResponseFormat(ConceptExtractSchema, "concepts"),
  });

  const parsedConcepts = structuredResponse.choices[0].message.parsed;
  if (!parsedConcepts) {
    throw new Error("Failed to extract concepts from nodes");
  }

  // Create and connect nodes
  const newNodes = parsedConcepts.map((conceptData) => {
    const newNode = new ConceptNode(conceptData.concept);

    // Connect to existing nodes
    conceptData.connectedToNodesWithIds.forEach((existingNodeId) => {
      const existingNode = nodes.find((n) => n.id === existingNodeId);
      if (existingNode) {
        connectNodes(newNode, existingNode);
      }
    });

    return newNode;
  });

  // Check for connections between concept nodes
  const conceptDescriptions = newNodes
    .map((n) => `Concept ${n.id}: ${n.description}`)
    .join("\n");

  const conceptUnstructuredResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Analyze these concepts and identify which ones are closely related enough to be connected. Provide reasoning for your suggested connections before listing them.",
      },
      {
        role: "user",
        content: conceptDescriptions,
      },
    ],
  });

  const conceptUnstructuredResponseText =
    conceptUnstructuredResponse.choices[0].message.content;
  if (!conceptUnstructuredResponseText) {
    throw new Error("Failed to analyze concept relationships");
  }

  const conceptStructuredResponse = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Based on the previous analysis, provide a structured output of which concept nodes should be connected to each other.",
      },
      {
        role: "user",
        content: conceptUnstructuredResponseText,
      },
    ],
    response_format: zodResponseFormat(
      z.array(
        z.object({
          sourceConceptId: z.string(),
          targetConceptId: z.string(),
        })
      ),
      "connections"
    ),
  });

  const parsedConnections = conceptStructuredResponse.choices[0].message.parsed;
  if (!parsedConnections) {
    throw new Error("Failed to parse concept connections");
  }

  // Connect related concept nodes
  parsedConnections.forEach(({ sourceConceptId, targetConceptId }) => {
    const sourceNode = newNodes.find((n) => n.id === sourceConceptId);
    const targetNode = newNodes.find((n) => n.id === targetConceptId);
    if (sourceNode && targetNode) {
      connectNodes(sourceNode, targetNode);
    }
  });

  return newNodes;
}
