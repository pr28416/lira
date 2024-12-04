"use client";

import React, {
  useCallback,
  createContext,
  useContext,
  ReactNode,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import {
  useNodesState,
  addEdge,
  Node,
  Edge,
  Connection,
  OnNodesChange,
  OnEdgesChange,
  applyEdgeChanges,
  applyNodeChanges,
  NodeChange,
  EdgeChange,
  useEdgesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { Engine } from "@/lib/engine/schemas/engine";
import { disconnectNodes, GenericNode } from "@/lib/engine/nodes/generic-node";

// Define the context type
interface FlowContextType {
  nodes: Node[];
  edges: Edge[];
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: (connection: Connection) => void;
  engine: Engine;
  setEngine: Dispatch<SetStateAction<Engine>>;
  addNode: (node: GenericNode, position: { x: number; y: number }) => Node;
  selectedNode: Node | null;
  setSelectedNode: Dispatch<SetStateAction<Node | null>>;
}

// Create the context
const FlowContext = createContext<FlowContextType | undefined>(undefined);

// Create the provider component
export function FlowProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<Engine>(new Engine());
  const [nodes, setNodes]: [
    Node[],
    Dispatch<SetStateAction<Node[]>>,
    OnNodesChange<Node>
  ] = useNodesState<Node>([]);
  const [edges, setEdges]: [
    Edge[],
    Dispatch<SetStateAction<Edge[]>>,
    OnEdgesChange<Edge>
  ] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const addNode = useCallback(
    (
      node: GenericNode,
      position: { x: number; y: number } = { x: 0, y: 0 }
    ) => {
      const flowNode: Node = {
        id: node.id,
        data: { node: node },
        position: position,
        type: "flowNode",
      };
      engine.addNode(node);
      setNodes((nds) => [...nds, flowNode]);
      return flowNode;
    },
    [setNodes, engine]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      console.log("Applying node changes", changes);
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  return (
    <FlowContext.Provider
      value={{
        nodes,
        edges,
        setNodes,
        setEdges,
        onConnect,
        onNodesChange,
        onEdgesChange,
        engine,
        setEngine,
        addNode,
        selectedNode,
        setSelectedNode,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
}

// Create a custom hook to use the context
export function useFlow() {
  const context = useContext(FlowContext);
  if (context === undefined) {
    throw new Error("useFlow must be used within a FlowProvider");
  }
  return context;
}
