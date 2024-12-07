"use client";

import { Fragment } from "react";
import { Handle, NodeProps, NodeToolbar, Position, addEdge } from "@xyflow/react";
import { FlowNode, NodeType } from "@/lib/engine/types";
import ConceptNodeView from "./concept-flow-node-view";
import PaperNodeView from "./paper-flow-node-view";
import InsightNodeView from "./insight-flow-node-view";
import QuestionNodeView from "./question-flow-node-view";
import { Button } from "../button";
import { StickyNote, Trash2 } from "lucide-react";
import { useFlow } from "@/contexts/node-context";
import { cn, getNodeTypeColor, getRandomPosition } from "@/lib/utils";
import { ConceptNode } from "@/lib/engine/nodes/concept-node";
import { GenericNode } from "@/lib/engine/nodes/generic-node";

function NodePicker({ nodeProps }: { nodeProps: NodeProps<FlowNode> }) {
  const { data } = nodeProps;
  switch (data.node.type) {
    case NodeType.CONCEPT:
      return <ConceptNodeView nodeProps={nodeProps} />;
    case NodeType.PAPER:
      return <PaperNodeView nodeProps={nodeProps} />;
    case NodeType.INSIGHT:
      return <InsightNodeView nodeProps={nodeProps} />;
    case NodeType.QUESTION:
      return <QuestionNodeView nodeProps={nodeProps} />;
    default:
      return (
        <div className="text-center">
          {data.node.type}: {data.node.id}
        </div>
      );
  }
}

export default function FlowNodeView(nodeProps: NodeProps<FlowNode>) {
  const { data } = nodeProps;
  const { onNodesChange, selectedNode, addNode, addEdgeBetweenNodes } = useFlow();

  const handleDelete = () => {
    onNodesChange([
      {
        id: nodeProps.id,
        type: "remove",
      },
    ]);
  };

  const handleAddConcept = () => {
    const node = selectedNode as FlowNode;
    if (!node) return;
    const { x, y } = getRandomPosition(node, 200);
    const newNode = addNode(new ConceptNode(""), {
      x,
      y,
    });
    addEdgeBetweenNodes(data.node as GenericNode, newNode.data.node as GenericNode);
  };

  return (
    <Fragment>
      <NodeToolbar className="flex flex-row gap-2" position={Position.Bottom}>
        <Button
          variant="outline"
          size="icon"
          className="hover:border-primary hover:text-primary-foreground"
          onClick={handleAddConcept}
        >
          <StickyNote />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleDelete}
        >
          <Trash2 />
        </Button>
      </NodeToolbar>
      <div
        className={cn(
          "flex flex-col divide-y shadow-md border max-w-sm rounded-lg",
          data.node.type === NodeType.PAPER && "bg-paperCard",
          data.node.type === NodeType.QUESTION && "bg-questionCard",
          data.node.type === NodeType.CONCEPT && "bg-card",
          selectedNode?.id === nodeProps.id && "border border-primary rounded-lg",
          // (selectedNode as FlowNode)?.data.node.neighbors
          //   .map((n) => n.id)
          //   .includes(data.node.id)
          //   .? "border border-red-500 rounded-lg" :
          selectedNode !== null &&
            selectedNode.id !== nodeProps.id &&
            "opacity-50"
        )}
      >
        <NodePicker nodeProps={nodeProps} />
        <div className="flex flex-row py-1.5 px-2 gap-4 justify-between bg-secondary items-center rounded-b-lg">
          <p
            className={cn(
              "text-xs font-bold",
              getNodeTypeColor(data.node.type)
            )}
          >
            {data.node.type}
          </p>
          <p className="text-xs text-muted-foreground italic">{data.node.id}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={true}
        style={{ width: 10, height: 10 }}
      />
    </Fragment>
  );
}
