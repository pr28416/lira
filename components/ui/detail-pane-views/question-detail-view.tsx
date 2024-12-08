"use client";

import { useFlow } from "@/contexts/node-context";
import { QuestionNode } from "@/lib/engine/nodes/question-node";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "../button";
import { useState } from "react";
import { Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import ArxivAiSearchModal from "../nodes/arxiv-ai-search-modal";
import { FlowNodeData } from "@/lib/engine/types";

export default function QuestionDetailView({ node }: { node: Node }) {
  const questionNode = node.data.node as QuestionNode;
  const { onNodesChange } = useFlow();
  const [question, setQuestion] = useState(questionNode.question);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(event.target.value);
  };

  const handleCancel = () => {
    setQuestion(questionNode.question);
  };

  const handleSave = () => {
    questionNode.setQuestion(question);
    onNodesChange([
      {
        id: questionNode.id,
        type: "replace",
        item: {
          id: questionNode.id,
          data: { node: questionNode },
          type: "flowNode",
          position: {
            x: node.position.x,
            y: node.position.y,
          },
        },
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-4 items-center w-full h-full">
      <div className="flex flex-col gap-2 w-full">
        <TextareaAutosize
          value={question}
          onChange={handleChange}
          className="w-full bg-secondary p-2 rounded-lg resize-none focus:outline-none"
          placeholder="Enter your question here..."
          maxLength={2048}
        />
        <div className="text-xs text-muted-foreground text-right">
          {question.length} / 2048
        </div>
      </div>
      <div
        className={cn(
          "w-full flex flex-row justify-between items-center gap-2",
          questionNode.question === question && "hidden"
        )}
      >
        <Button variant="outline" onClick={handleCancel} className="w-full">
          Cancel
        </Button>
        <Button onClick={handleSave} className="w-full">
          Save
        </Button>
      </div>
      <div className="w-full">
        <ArxivAiSearchModal flowNodeData={node.data as FlowNodeData}>
          <Button variant="outline" className="w-full">
            Search on ArXiv for related papers
          </Button>
        </ArxivAiSearchModal>
      </div>
    </div>
  );
}
