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
import {
  connectNodes,
  disconnectNodes,
  GenericNode,
} from "@/lib/engine/nodes/generic-node";

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
  addEdgeBetweenNodes: (node1: GenericNode, node2: GenericNode) => void;
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
      setEdges((eds) => {
        const sourceNode = engine.getNode(connection.source ?? "");
        const targetNode = engine.getNode(connection.target ?? "");
        if (sourceNode && targetNode) {
          connectNodes(sourceNode, targetNode);
        }
        return addEdge(connection, eds);
      });
    },
    [setEdges, engine]
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

  const addEdgeBetweenNodes = useCallback(
    (node1: GenericNode, node2: GenericNode) => {
      setEdges((eds) =>
        addEdge(
          {
            source: node1.id,
            target: node2.id,
            sourceHandle: null,
            targetHandle: null,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        for (const change of changes) {
          if (change.type === "remove") {
            const removedNode = engine.getNode(change.id);
            if (removedNode) {
              engine.removeNode(removedNode.id);
            }
            if (selectedNode?.id === change.id) {
              setSelectedNode(null);
            }
          }
        }
        return applyNodeChanges(changes, nds);
      });
    },
    [setNodes, engine, selectedNode]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        for (const change of changes) {
          if (change.type === "remove") {
            const removedEdge = edges.find((edge) => edge.id === change.id);
            if (removedEdge) {
              console.log("Removing edge", removedEdge);
              const sourceNode = engine.getNode(removedEdge?.source ?? "");
              const targetNode = engine.getNode(removedEdge?.target ?? "");
              if (sourceNode && targetNode) {
                disconnectNodes(sourceNode, targetNode);
              }
            }
          } else if (change.type === "add") {
            const sourceNode = engine.getNode(change.item.source ?? "");
            const targetNode = engine.getNode(change.item.target ?? "");
            if (sourceNode && targetNode) {
              connectNodes(sourceNode, targetNode);
            }
          }
        }

        return applyEdgeChanges(changes, eds);
      });
    },
    [setEdges, engine, edges]
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
        addEdgeBetweenNodes,
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
