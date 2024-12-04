import { GenericNode } from "../nodes/generic-node";

export class Engine {
  nodes: GenericNode[];

  constructor() {
    this.nodes = [];
  }

  addNode(node: GenericNode) {
    this.nodes.push(node);
  }

  removeNode(nodeId: string) {
    this.nodes = this.nodes.filter((node) => node.id !== nodeId);
  }

  getNode(nodeId: string): GenericNode | undefined {
    return this.nodes.find((node) => node.id === nodeId);
  }
}
