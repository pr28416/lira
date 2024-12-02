"use client";

import { useFlow } from "@/contexts/node-context";
import { FlowNode, NodeType } from "@/lib/engine/types";
import QuestionDetailView from "./question-detail-view";
import ConceptDetailView from "./concept-detail-view";
import { cn } from "@/lib/utils";
import { getNodeTypeColor } from "@/lib/utils";

export default function DetailPaneView() {
  const { selectedNode } = useFlow();
  if (!selectedNode)
    return (
      <div className="bg-card w-full max-w-2xl flex justify-center items-center italic p-4">
        No selected node
      </div>
    );

  const node = selectedNode as FlowNode;
  return (
    <div className="w-full max-w-2xl p-4 flex flex-col gap-4">
      <div className="flex flex-row justify-between items-center">
        <p
          className={cn(
            "text-xs font-bold",
            getNodeTypeColor(node.data.node.type)
          )}
        >
          {node.data.node.type}
        </p>
        <p className="text-xs text-muted-foreground italic">{node.id}</p>
      </div>
      {node.data.node.type === NodeType.QUESTION ? (
        <QuestionDetailView node={node} />
      ) : node.data.node.type === NodeType.CONCEPT ? (
        <ConceptDetailView node={node} />
      ) : null}
    </div>
  );
}
