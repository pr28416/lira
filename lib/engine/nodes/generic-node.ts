import { v4 as uuidv4 } from "uuid";
import { NodeType } from "../types";

export class GenericNode {
  id: string;
  type: NodeType;
  neighbors: GenericNode[];

  constructor(type: NodeType) {
    this.id = uuidv4();
    this.type = type;
    this.neighbors = [];
  }

  addNeighbor(node: GenericNode) {
    this.neighbors.push(node);
  }

  removeNeighbor(node: GenericNode) {
    this.neighbors = this.neighbors.filter((n) => n.id !== node.id);
  }

  getAiStringDescription(): string {
    return "";
  }
}

export function connectNodes(node1: GenericNode, node2: GenericNode) {
  node1.addNeighbor(node2);
  node2.addNeighbor(node1);
}

export function disconnectNodes(node1: GenericNode, node2: GenericNode) {
  node1.removeNeighbor(node2);
  node2.removeNeighbor(node1);
}
