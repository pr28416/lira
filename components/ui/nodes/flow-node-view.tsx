import { Fragment } from "react";
import { Handle, NodeProps, NodeToolbar, Position } from "@xyflow/react";
import { FlowNode, NodeType } from "@/lib/engine/types";
import ConceptNodeView from "./concept-flow-node-view";
import PaperNodeView from "./paper-flow-node-view";
import InsightNodeView from "./insight-flow-node-view";
import QuestionNodeView from "./question-flow-node-view";
import { Button } from "../button";
import { Trash2 } from "lucide-react";
import { useFlow } from "@/contexts/node-context";
import { cn, getNodeTypeColor } from "@/lib/utils";

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
  const { onNodesChange, selectedNode } = useFlow();

  const handleDelete = () => {
    onNodesChange([
      {
        id: nodeProps.id,
        type: "remove",
      },
    ]);
  };

  return (
    <Fragment>
      <NodeToolbar className="flex flex-row gap-2" position={Position.Bottom}>
        <Button
          variant="outline"
          size="icon"
          className="hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleDelete}
        >
          <Trash2 />
        </Button>
      </NodeToolbar>
      {/* <Handle type="target" position={Position.Top} /> */}
      <div
        className={cn(
          "flex flex-col bg-card divide-y shadow-md border",
          selectedNode?.id === nodeProps.id && "border border-primary"
        )}
      >
        <NodePicker nodeProps={nodeProps} />
        <div className="flex flex-row py-1.5 px-2 gap-4 justify-between bg-secondary items-center">
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
