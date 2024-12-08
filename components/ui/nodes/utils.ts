//
// TODO: Probably delete this file
//

import { GenericNode } from "@/lib/engine/nodes/generic-node";
import { PaperNode } from "@/lib/engine/nodes/paper-node";
import { QuestionNode } from "@/lib/engine/nodes/question-node";
import { FlowNodeData, PaperMetadata } from "@/lib/engine/types";
import { Node } from "@xyflow/react";

export function handleAddPapers(
  nodes: Node[],
  flowNodeData: FlowNodeData,
  results: PaperMetadata[],
  selectedResultUrls: string[],
  addNode: (node: GenericNode, position: { x: number; y: number }) => void,
  addEdgeBetweenNodes: (source: GenericNode, target: GenericNode) => void
) {
  const questionNode = flowNodeData.node as QuestionNode;
  const node = nodes.find((n) => n.id === questionNode.id);
  if (!node) {
    console.error("Node not found");
    return;
  }

  const selectedPapers = results.filter((paper) =>
    selectedResultUrls.includes(paper.URL)
  );
  const numNodes = selectedPapers.length;
  const a = Math.min(node.width ?? 200, node.height ?? 100) / 2;
  const centerX = node.position.x;
  const centerY = node.position.y;

  selectedPapers.map((paperMetadata, index) => {
    const paperNode = new PaperNode(paperMetadata);

    const mu = 3;
    const nu = (2 * Math.PI * index) / numNodes;
    const x = a * Math.cosh(mu) * Math.cos(nu);
    const y = a * Math.sinh(mu) * Math.sin(nu);

    addNode(paperNode, {
      x: centerX + x + (node.width ?? 0) / 2,
      y: centerY + y + (node.height ?? 0) / 2,
    });
    addEdgeBetweenNodes(questionNode, paperNode);
  });
}
