import { NodeProps } from "@xyflow/react";
import { InsightNode } from "@/lib/engine/nodes/insight-node";
import { FlowNode } from "@/lib/engine/types";

export default function InsightNodeView({
  nodeProps,
}: {
  nodeProps: NodeProps<FlowNode>;
}) {
  const { data } = nodeProps;
  const insightNode = data.node as InsightNode;

  return (
    <div className="p-2 text-wrap bg-teal-100 dark:bg-teal-950">
      {insightNode.conclusion}
    </div>
  );
}
