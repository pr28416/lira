"use client";

import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  // Controls,
  // MiniMap,
  Node,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import { ReactFlow } from "@xyflow/react";
import { QuestionNode } from "@/lib/engine/nodes/question-node";
import { PaperNode } from "@/lib/engine/nodes/paper-node";
import { AddNodeButtonOption } from "@/app/enums";
import FlowNodeView from "@/components/ui/nodes/flow-node-view";
import { useState } from "react";
import { useFlow } from "@/contexts/node-context";
import AddNodeButton from "@/components/ui/add-node-button";
import { PaperMetadata } from "@/lib/engine/types";
import { loadCitedPapers, summarizePaper } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const nodeTypes = {
  flowNode: FlowNodeView,
};

export function ReactFlowCanvas({
  setDetailPaneOpen,
}: {
  setDetailPaneOpen: (x: boolean) => void;
}) {
  const [lastPos, setLastPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const { setCenter } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
  } = useFlow();

  const globalToaster = useToast();

  const handleToast = (title: string, description: string, isDone: boolean) => {
    globalToaster.toast({
      title: title,
      description: description,
      duration: isDone ? 5 * 1000 : 10 * 60 * 1000,
    });
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    setLastPos({ x: event.pageX, y: event.pageY });
    console.log("Set last position!");
    console.log(lastPos);
  };

  const handleAddNode = async (
    option: AddNodeButtonOption,
    content: unknown
  ) => {
    let newNode: Node | null = null;
    switch (option) {
      case AddNodeButtonOption.QUESTION:
        newNode = addNode(new QuestionNode(content as string), {
          x: lastPos.x,
          y: lastPos.y,
        });
        break;
      case AddNodeButtonOption.PAPER:
        const paperContent = content as PaperMetadata;
        const newPaper = new PaperNode(paperContent);
        newNode = addNode(newPaper, {
          x: lastPos.x,
          y: lastPos.y,
        });
        if (!newNode) {
          return;
        }
        loadCitedPapers(
          newPaper,
          newNode,
          onNodesChange,
          () => {},
          handleToast
        );
        summarizePaper(newPaper, newNode, onNodesChange, handleToast);
        break;
      // case AddNodeButtonOption.CONCEPT:
      //   newNode = addNode(new ConceptNode(content as string), {
      //     x: lastPos.x,
      //     y: lastPos.y,
      //   });
      //   break;
      // case AddNodeButtonOption.INSIGHT:
      //   newNode = addNode(new InsightNode(content as string), {
      //     x: lastPos.x,
      //     y: lastPos.y,
      //   });
      //   break;
      default:
        newNode = null;
        break;
    }
    if (newNode) {
      setSelectedNode(newNode);
      setDetailPaneOpen(true);
      setTimeout(() => {
        setCenter(newNode.position.x + 175, newNode.position.y, {
          zoom: 1,
          duration: 800,
        });
      }, 100);
    }
  };

  return (
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
        setTimeout(() => {
          setCenter(node.position.x + 175, node.position.y, {
            zoom: 0.9,
            duration: 1000,
          });
        }, 100);
      }}
      onPaneClick={() => {
        setSelectedNode(null);
        setDetailPaneOpen(false);
      }}
      connectionMode={ConnectionMode.Loose}
      zoomOnDoubleClick={true}
      onClick={handleClick}
    >
      {/* <Controls /> */}
      {/* <MiniMap /> */}
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      <Panel position="top-right">
        <AddNodeButton
          onClick={(option, content) => handleAddNode(option, content)}
        />
      </Panel>
    </ReactFlow>
  );
}
