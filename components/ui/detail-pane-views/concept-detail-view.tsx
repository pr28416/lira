"use client";

import { useFlow } from "@/contexts/node-context";
import { ConceptNode } from "@/lib/engine/nodes/concept-node";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "../button";
import { useState } from "react";
import { Node } from "@xyflow/react";
import { cn } from "@/lib/utils";

export default function ConceptDetailView({ node }: { node: Node }) {
  const conceptNode = node.data.node as ConceptNode;
  const { onNodesChange } = useFlow();
  const [description, setDescription] = useState(conceptNode.description);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  const handleCancel = () => {
    setDescription(conceptNode.description);
  };

  const handleSave = () => {
    conceptNode.setDescription(description);
    onNodesChange([
      {
        id: conceptNode.id,
        type: "replace",
        item: {
          id: conceptNode.id,
          data: { node: conceptNode },
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
    <div className="flex flex-col gap-4 items-center justify-between w-full h-full">
      <div className="flex flex-col gap-2 w-full">
        <TextareaAutosize
          value={description}
          onChange={handleChange}
          className="w-full bg-secondary p-2 rounded-lg resize-none focus:outline-none"
          placeholder="Enter your concept here..."
          maxLength={2048}
        />
        <div className="text-xs text-muted-foreground text-right">
          {description.length} / 4096
        </div>
      </div>
      <div
        className={cn(
          "w-full flex flex-row justify-between items-center gap-2",
          conceptNode.description === description && "hidden"
        )}
      >
        <Button variant="outline" onClick={handleCancel} className="w-full">
          Cancel
        </Button>
        <Button onClick={handleSave} className="w-full">
          Save
        </Button>
      </div>
    </div>
  );
}
