import { openai } from "@/lib/ai/openai";
import { ConceptsSchema } from "@/lib/engine/types";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import {
  ConceptNode,
  ConceptNodeData,
  createConceptNodeDataFromNode,
} from "../../nodes/concept-node";
import { connectNodes } from "../../nodes/generic-node";
import { ConceptGenerationProgress } from "./types";
import { z } from "zod";

export default async function* getConceptsFromSummary(
  summary: string
): AsyncGenerator<ConceptGenerationProgress | ConceptNodeData[]> {
  // Phase 1: Extract concepts
  yield {
    title: "Extracting Concepts",
    description: "Analyzing summary to identify key concepts...",
  };

  const unstructuredResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Extract key concepts from this research paper summary. A concept should be a significant idea, technique, finding, or contribution, described in 1-3 clear sentences. For example: 'The authors propose a model-agnostic technique involving systematic addition of Gaussian noise to model parameters. This noise aims to disrupt the internal representations of models that are sandbagging.'\n\n" +
          "Provide brief reasoning for why each extracted concept is significant before listing them.",
      },
      {
        role: "user",
        content: summary,
      },
    ],
  });

  const unstructuredResponseText =
    unstructuredResponse.choices[0].message.content;
  if (!unstructuredResponseText) {
    throw new Error("Failed to extract concepts from summary");
  }

  yield {
    title: "Structuring Concepts",
    description: "Converting extracted concepts into structured format...",
  };

  // Get structured concepts
  const structuredResponse = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Based on the previous concept extraction, turn those concepts into a structured list. Remember that the concepts should be a concise 1-3 sentence description of a key idea or finding. You've already provided the concepts, so just turn them into a structured list.",
      },
      {
        role: "user",
        content: unstructuredResponseText,
      },
    ],
    response_format: zodResponseFormat(ConceptsSchema, "concepts"),
  });

  const concepts = structuredResponse.choices[0].message.parsed;
  if (!concepts) {
    return [];
  }

  // Create concept nodes
  const conceptNodes = concepts.concepts.map(
    (concept) => new ConceptNode(concept)
  );

  // Phase 2: Analyze relationships between concepts
  yield {
    title: "Analyzing Relationships",
    description: "Identifying connections between concepts...",
  };

  // Generate all pairs of nodes
  const nodePairs: [ConceptNode, ConceptNode][] = [];
  for (let i = 0; i < conceptNodes.length; i++) {
    for (let j = i + 1; j < conceptNodes.length; j++) {
      nodePairs.push([conceptNodes[i], conceptNodes[j]]);
    }
  }

  // Analyze all pairs in parallel
  const analysisResults = await Promise.all(
    nodePairs.map(([node1, node2]) => analyzeNodePair(node1, node2))
  );

  // Create connections based on results
  analysisResults.forEach(({ node1, node2, shouldConnect }) => {
    if (shouldConnect) {
      connectNodes(node1, node2);
    }
  });

  // Yield the final concept nodes before returning
  yield {
    title: "Results",
    description: `Generated ${conceptNodes.length} concepts with their relationships`,
  };

  yield conceptNodes.map(createConceptNodeDataFromNode);
}

async function analyzeNodePair(node1: ConceptNode, node2: ConceptNode) {
  // Get unstructured reasoning
  const reasoningResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Very concisely explain whether and why these two concepts might be related. Keep it to 2-3 sentences. Be on the more conservative side, meaning that if you're not sure, you should say they're not related.",
      },
      {
        role: "user",
        content: `Concept 1: ${node1.description}\nConcept 2: ${node2.description}`,
      },
    ],
  });

  const reasoning = reasoningResponse.choices[0].message.content;

  // Get structured decision
  const decisionResponse = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Based on the previous reasoning, should these concepts be connected? Return true or false.",
      },
      {
        role: "user",
        content: reasoning || "",
      },
    ],
    response_format: zodResponseFormat(
      z.object({ shouldConnect: z.boolean() }),
      "decision"
    ),
  });

  const shouldConnect =
    decisionResponse.choices[0].message.parsed?.shouldConnect;

  return {
    node1,
    node2,
    reasoning,
    shouldConnect,
  };
}
