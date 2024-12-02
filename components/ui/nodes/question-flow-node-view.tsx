import { NodeProps } from "@xyflow/react";
import { QuestionNode } from "@/lib/engine/nodes/question-node";
import { FlowNode } from "@/lib/engine/types";
export default function QuestionNodeView({
  nodeProps,
}: {
  nodeProps: NodeProps<FlowNode>;
}) {
  const { data } = nodeProps;
  const questionNode = data.node as QuestionNode;

  return questionNode.question ? (
    <p className="p-2 text-wrap">{questionNode.question}</p>
  ) : (
    <p className="italic p-2 text-wrap text-muted-foreground">
      Click to enter question
    </p>
  );
}
