"use client";

import { Button } from "@/components/ui/button";
import { useFlow } from "@/contexts/node-context";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  Node,
  Panel,
  ReactFlowProvider,
} from "@xyflow/react";
import { ReactFlow } from "@xyflow/react";
import { QuestionNode } from "@/lib/engine/nodes/question-node";
import { PaperNode } from "@/lib/engine/nodes/paper-node";
import { ConceptNode } from "@/lib/engine/nodes/concept-node";
import { InsightNode } from "@/lib/engine/nodes/insight-node";
import { AddNodeButtonOption } from "./enums";
import FlowNodeView from "@/components/ui/nodes/flow-node-view";
import { useState } from "react";
import DetailPaneView from "@/components/ui/detail-pane-views/detail-pane-view";
import { PaperMetadata } from "@/lib/engine/types";
import AddNodeButton from "@/components/ui/add-node-button";
import { ExtractReferencesResponse } from "@/lib/engine/services/arxiv/types";

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

  const handleAddNode = async (
    option: AddNodeButtonOption,
    content: unknown
  ) => {
    let newNode: Node | null = null;
    switch (option) {
      case AddNodeButtonOption.QUESTION:
        newNode = addNode(new QuestionNode(content as string), {
          x: 0,
          y: 0,
        });
        break;
      case AddNodeButtonOption.PAPER:
        const paperContent = content as PaperMetadata;
        const newPaper = new PaperNode(paperContent);
        newNode = addNode(newPaper, {
          x: 0,
          y: 0,
        });
        if (!newNode) {
          return;
        }
        fetch("/api/arxiv/extract-references", {
          method: "POST",
          body: JSON.stringify({ arxivLink: paperContent.URL }),
        }).then(async (response) => {
          const citedArxivPapers: ExtractReferencesResponse =
            await response.json();
          newPaper.citedArxivPapers = citedArxivPapers.papers;
          newPaper.citedUrls = citedArxivPapers.nonPapers;
          onNodesChange([
            {
              id: newPaper.id,
              type: "replace",
              item: {
                id: newPaper.id,
                data: { node: newPaper },
                type: "flowNode",
                position: newNode!.position,
              },
            },
          ]);
        });
        break;
      case AddNodeButtonOption.CONCEPT:
        newNode = addNode(new ConceptNode(content as string), {
          x: 0,
          y: 0,
        });
        break;
      case AddNodeButtonOption.INSIGHT:
        newNode = addNode(new InsightNode(content as string), {
          x: 0,
          y: 0,
        });
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
    <div className="flex flex-row w-full h-screen divide-x">
      {/* Nav bar */}

      {/* Main content */}
      <div className="w-full flex flex-col divide-y">
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
            connectionMode={ConnectionMode.Loose}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Panel position="top-right">
              <AddNodeButton
                onClick={(option, content) => handleAddNode(option, content)}
              />
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
        {/* Detail pane */}
      </div>
      {detailPaneOpen && <DetailPaneView />}
    </div>
  );
}
