import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NodeType } from "./engine/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNodeTypeColor(nodeType: NodeType): string {
  console.log("nodeType", nodeType);
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
