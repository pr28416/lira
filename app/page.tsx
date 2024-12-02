"use client";

import { Button } from "@/components/ui/button";
import { useFlow } from "@/contexts/node-context";
import { PanelRightClose, PanelRightOpen, Plus } from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  Panel,
  ReactFlowProvider,
} from "@xyflow/react";
import { ReactFlow } from "@xyflow/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuestionNode } from "@/lib/engine/nodes/question-node";
import { PaperNode } from "@/lib/engine/nodes/paper-node";
import { ConceptNode } from "@/lib/engine/nodes/concept-node";
import { InsightNode } from "@/lib/engine/nodes/insight-node";
import { AddNodeButtonOption } from "./enums";
import FlowNodeView from "@/components/ui/nodes/flow-node-view";
import { useState } from "react";
import DetailPaneView from "@/components/ui/detail-pane-views/detail-pane-view";

function AddNodeButton({
  onClick,
}: {
  onClick?: (selectedOption: AddNodeButtonOption) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-primary rounded-full" size="icon">
          <Plus className="" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.values(AddNodeButtonOption).map((option) => (
          <DropdownMenuItem key={option} onClick={() => onClick?.(option)}>
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const nodeTypes = {
  flowNode: FlowNodeView,
};

export default function Home() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
  } = useFlow();

  const handleAddNode = (option: AddNodeButtonOption, content: string) => {
    let newNode: Node | null = null;
    switch (option) {
      case AddNodeButtonOption.QUESTION:
        newNode = addNode(new QuestionNode(content));
        break;
      case AddNodeButtonOption.PAPER:
        newNode = addNode(
          new PaperNode({
            title: "Sample paper",
            DOI: "1234567890",
            URL: "https://example.com",
          })
        );
        break;
      case AddNodeButtonOption.CONCEPT:
        newNode = addNode(new ConceptNode(content));
        break;
      case AddNodeButtonOption.INSIGHT:
        newNode = addNode(new InsightNode(content));
        break;
      default:
        newNode = null;
        break;
    }
    if (newNode) {
      setSelectedNode(newNode);
      setDetailPaneOpen(true);
    }
  };

  const [detailPaneOpen, setDetailPaneOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col divide-y dark">
      {/* Nav bar */}
      <div className="px-4 py-2 flex flex-row bg-background justify-between items-center">
        <p className="text-xl font-mono text-primary">LiRA</p>
        <Button
          variant={detailPaneOpen ? "default" : "outline"}
          size="icon"
          onClick={() => setDetailPaneOpen(!detailPaneOpen)}
        >
          {detailPaneOpen ? <PanelRightClose /> : <PanelRightOpen />}
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-row w-full h-full divide-x">
        {/* React flow canvas */}
        <ReactFlowProvider>
          <ReactFlow
            nodeTypes={nodeTypes}
            colorMode="dark"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            onNodeClick={(_, node) => {
              setSelectedNode(node);
              setDetailPaneOpen(true);
            }}
            onPaneClick={() => {
              setSelectedNode(null);
            }}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Panel position="top-right">
              <AddNodeButton onClick={(option) => handleAddNode(option, "")} />
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
        {/* Detail pane */}
        {detailPaneOpen && <DetailPaneView />}
      </div>
    </div>
  );
}
