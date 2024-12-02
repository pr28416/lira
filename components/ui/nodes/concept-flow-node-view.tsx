import { NodeProps } from "@xyflow/react";
import { ConceptNode } from "@/lib/engine/nodes/concept-node";
import { FlowNode } from "@/lib/engine/types";

export default function ConceptNodeView({
  nodeProps,
}: {
  nodeProps: NodeProps<FlowNode>;
}) {
  const { data } = nodeProps;
  const conceptNode = data.node as ConceptNode;

  return conceptNode.description ? (
    <p className="p-2 text-wrap">{conceptNode.description}</p>
  ) : (
    <p className="italic p-2 text-wrap text-muted-foreground">
      Click to enter concept
    </p>
  );
}
