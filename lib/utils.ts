import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NodeType } from "./engine/types";
import { PaperNode } from "./engine/nodes/paper-node";
import {
  ExtractReferencesResponse,
  PaperSummary,
  PaperSummaryProgress,
  PaperSummaryChunk,
} from "./engine/services/arxiv/types";
import { Node, NodeChange } from "@xyflow/react";
import { extractArxivId } from "./engine/services/arxiv/extract-arxiv-id";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNodeTypeColor(nodeType: NodeType): string {
  switch (nodeType) {
    case NodeType.CONCEPT:
      return "text-amber-600 dark:text-amber-500";
    case NodeType.PAPER:
      return "text-blue-600 dark:text-blue-500";
    case NodeType.INSIGHT:
      return "text-green-600 dark:text-green-500";
    case NodeType.QUESTION:
      return "text-purple-600 dark:text-purple-500";
    default:
      return "text-primary";
  }
}

export function loadCitedPapers(
  paperNode: PaperNode,
  node: Node,
  onNodesChange: (changes: NodeChange[]) => void,
  setIsLoadingCitedPapers?: (isLoading: boolean) => void,
  toast?: (title: string, description: string, isDone: boolean) => void
) {
  if (setIsLoadingCitedPapers) {
    setIsLoadingCitedPapers(true);
  }

  toast?.("Citations", "Loading cited papers...", false);

  fetch("/api/arxiv/extract-references", {
    method: "POST",
    body: JSON.stringify({ arxivLink: paperNode.rawPaperMetadata?.URL }),
  }).then(async (response) => {
    const citedArxivPapers: ExtractReferencesResponse = await response.json();

    const newCitedArxivPapers = citedArxivPapers.papers;
    citedArxivPapers.papers.forEach((paper, index) => {
      if (paper.title === paperNode.rawPaperMetadata?.title) {
        newCitedArxivPapers.splice(index, 1);
      }
    });

    paperNode.citedArxivPapers = newCitedArxivPapers;
    paperNode.citedUrls = citedArxivPapers.nonPapers;
    onNodesChange([
      {
        id: paperNode.id,
        type: "replace",
        item: {
          id: paperNode.id,
          data: { node: paperNode },
          type: "flowNode",
          position: node.position,
        },
      },
    ]);

    if (setIsLoadingCitedPapers) {
      setIsLoadingCitedPapers(false);
    }

    toast?.("Citations", "Cited papers loaded.", true);
  }).catch((error) => {
    console.error("Error loading cited papers", error);
    toast?.("Citations", "Error loading cited papers", true);
  });
}

export function getRandomPosition(
  node: Node,
  distance: number
): { x: number; y: number } {
  const centerX = node.position.x + (node.width ?? 0) / 2;
  const centerY = node.position.y + (node.height ?? 0) / 2;

  const angle = Math.random() * 2 * Math.PI;

  const x = centerX + distance * Math.cos(angle);
  const y = centerY + distance * Math.sin(angle);

  return { x, y };
}

export function getNewNodePositions(
  centerX: number,
  centerY: number,
  numNodes: number,
  radius: number = 200
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];

  // Use elliptic coordinates for a more natural spacing
  const mu = 3; // Constant value determines the size of the ellipse
  const a = radius / 2; // Semi-major axis

  for (let i = 0; i < numNodes; i++) {
    // Calculate angle for even distribution around the ellipse
    const nu = (2 * Math.PI * i) / numNodes;

    // Convert elliptic coordinates to Cartesian using the standard equations
    const x = centerX + (a * Math.cosh(mu) * Math.cos(nu));
    const y = centerY + (a * Math.sinh(mu) * Math.sin(nu));

    positions.push({ x, y });
  }

  return positions;
}

export const summarizePaper = async (
  paperNode: PaperNode,
  node: Node,
  onNodesChange: (changes: NodeChange[]) => void,
  toast: (title: string, description: string, isDone: boolean) => void
) => {
  try {
    toast("Summarizing paper", "Summarizing paper...", false);
    const arxivLink = paperNode.rawPaperMetadata?.URL;
    if (!extractArxivId(arxivLink ?? "")) {
      return;
    }
    const response = await fetch("/api/arxiv/summarize-pdf", {
      method: "POST",
      body: JSON.stringify({ arxivLink }),
    });

    const reader = response.body?.getReader();

    while (true) {
      const { done, value } = (await reader?.read()) ?? {};
      if (done) break;

      // Each chunk will contain complete JSON lines
      const lines = new TextDecoder().decode(value).split("\n");
      paperNode.setAiSummary("");

      for (const line of lines) {
        if (line.trim()) {
          const update:
            | PaperSummaryChunk
            | PaperSummaryProgress
            | PaperSummary = JSON.parse(line);
          if ("summaryChunk" in update) {
            paperNode.setAiSummary(
              paperNode.getAiSummary() + update.summaryChunk
            );
          } else if ("pageSummaries" in update) {
            paperNode.setAiSummary(update.summary);
            onNodesChange([
              {
                id: paperNode.id,
                type: "replace",
                item: {
                  id: paperNode.id,
                  data: { node: paperNode },
                  type: "flowNode",
                  position: {
                    x: node.position.x,
                    y: node.position.y,
                  },
                },
              },
            ]);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error summarizing paper", error);
  } finally {
    toast("Summarizing paper", "Summarizing paper done!", true);
  }
};
