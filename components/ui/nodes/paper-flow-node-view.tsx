import { NodeProps } from "@xyflow/react";
import { PaperNode } from "@/lib/engine/nodes/paper-node";
import { FlowNode } from "@/lib/engine/types";

export default function PaperNodeView({
  nodeProps,
}: {
  nodeProps: NodeProps<FlowNode>;
}) {
  const { data } = nodeProps;
  const paperNode = data.node as PaperNode;

  return paperNode.rawPaperMetadata?.URL ? (
    <div className="p-2 flex flex-col gap-1">
      <p className="text-wrap">{paperNode.rawPaperMetadata.title}</p>
      <p className="text-wrap text-xs text-muted-foreground font-semibold">
        DOI: {paperNode.rawPaperMetadata.DOI}
      </p>
    </div>
  ) : (
    <p className="italic p-2 text-wrap text-muted-foreground">
      No paper metadata
    </p>
  );
}
