import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NodeType } from "./engine/types";
import { PaperNode } from "./engine/nodes/paper-node";
import { ExtractReferencesResponse } from "./engine/services/arxiv/types";
import { Node, NodeChange } from "@xyflow/react";

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
  setIsLoadingCitedPapers?: (isLoading: boolean) => void
) {
  if (setIsLoadingCitedPapers) {
    setIsLoadingCitedPapers(true);
  }

  fetch("/api/arxiv/extract-references", {
    method: "POST",
    body: JSON.stringify({ arxivLink: paperNode.rawPaperMetadata?.URL }),
  }).then(async (response) => {
    const citedArxivPapers: ExtractReferencesResponse =
      await response.json();

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
  });
}

export function getRandomPosition(node: Node, distance: number): { x: number; y: number } {
  const centerX = node.position.x + (node.width ?? 0) / 2;
  const centerY = node.position.y + (node.height ?? 0) / 2;

  const angle = Math.random() * 2 * Math.PI;

  const x = centerX + distance * Math.cos(angle);
  const y = centerY + distance * Math.sin(angle);

  return { x, y };
}
