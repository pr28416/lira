"use client";

import { Button } from "@/components/ui/button";
import { useFlow } from "@/contexts/node-context";
import { PanelRightClose, PanelRightOpen, Plus, Search } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaperMetadata } from "@/lib/engine/types";
import { Input } from "@/components/ui/input";

function AddNodeButton({
  onClick,
}: {
  onClick?: (selectedOption: AddNodeButtonOption, content: unknown) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [retrievedPaper, setRetrievedPaper] = useState<PaperMetadata | null>(
    null
  );
  const [isRetrievingPaper, setIsRetrievingPaper] = useState(false);
  const [arxivId, setArxivId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleOptionClick = (option: AddNodeButtonOption) => {
    if (option === AddNodeButtonOption.PAPER) {
      setIsDialogOpen(true);
    } else {
      onClick?.(option, "");
    }
  };

  const retrievePaper = async () => {
    try {
      setIsRetrievingPaper(true);
      setMessage("Retrieving paper...");
      const response = await fetch("/api/create-paper-node-from-arxiv", {
        method: "POST",
        body: JSON.stringify({ arxivId }),
      });
      const paper: PaperMetadata = await response.json();
      setRetrievedPaper(paper);
      setMessage(null);
    } catch (error) {
      setRetrievedPaper(null);
      setMessage(`Error retrieving paper: ${error}`);
    } finally {
      setIsRetrievingPaper(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-primary rounded-full" size="icon">
            <Plus className="" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Object.values(AddNodeButtonOption).map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Paper</DialogTitle>
          <DialogDescription>Enter the paper details below.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2">
            <Input
              placeholder="ArXiv ID"
              value={arxivId}
              onChange={(e) => setArxivId(e.target.value)}
            />
            <Button
              onClick={() => retrievePaper()}
              variant="outline"
              size="icon"
              disabled={isRetrievingPaper}
            >
              <Search />
            </Button>
          </div>
          {retrievedPaper && (
            <a
              className="flex flex-col gap-2 border rounded p-2 hover:opacity-70 transition-all"
              href={`https://doi.org/${retrievedPaper.DOI}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <p className="text-sm font-bold">{retrievedPaper.title}</p>
              <p className="text-xs text-muted-foreground">
                {retrievedPaper.authors?.join(", ") || "Unknown authors"}
              </p>
              {retrievedPaper.publishDate && (
                <p className="text-xs text-muted-foreground">
                  Published on{" "}
                  {new Date(retrievedPaper.publishDate).toLocaleDateString()}
                </p>
              )}
              <p className="text-xs">{retrievedPaper.abstract}</p>
            </a>
          )}
          {message && <p>{message}</p>}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              onClick?.(AddNodeButtonOption.PAPER, retrievedPaper);
              setIsDialogOpen(false);
            }}
          >
            Add Paper
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

  const handleAddNode = (option: AddNodeButtonOption, content: unknown) => {
    let newNode: Node | null = null;
    switch (option) {
      case AddNodeButtonOption.QUESTION:
        newNode = addNode(new QuestionNode(content as string));
        break;
      case AddNodeButtonOption.PAPER:
        newNode = addNode(new PaperNode(content as PaperMetadata));
        break;
      case AddNodeButtonOption.CONCEPT:
        newNode = addNode(new ConceptNode(content as string));
        break;
      case AddNodeButtonOption.INSIGHT:
        newNode = addNode(new InsightNode(content as string));
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
              <AddNodeButton
                onClick={(option, content) => handleAddNode(option, content)}
              />
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
        {/* Detail pane */}
        {detailPaneOpen && <DetailPaneView />}
      </div>
    </div>
  );
}
