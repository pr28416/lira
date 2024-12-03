"use client";

import { Node } from "@xyflow/react";
import { PaperNode } from "@/lib/engine/nodes/paper-node";

export default function PaperDetailView({ node }: { node: Node }) {
  const paperNode = node.data.node as PaperNode;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1 font-bold">
        <p>{paperNode.rawPaperMetadata?.title}</p>
        <p className="text-xs text-muted-foreground">
          {paperNode.rawPaperMetadata?.authors?.join(", ") || "Unknown authors"}
        </p>
      </div>
      <p className="text-xs leading-relaxed">
        {paperNode.rawPaperMetadata?.abstract}
      </p>
    </div>
  );
}
