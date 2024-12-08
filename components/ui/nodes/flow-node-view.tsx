import { Fragment, useState } from "react";
import { Handle, NodeProps, NodeToolbar, Position } from "@xyflow/react";
import { FlowNode, NodeType } from "@/lib/engine/types";
import ConceptNodeView from "./concept-flow-node-view";
import PaperNodeView from "./paper-flow-node-view";
import InsightNodeView from "./insight-flow-node-view";
import QuestionNodeView from "./question-flow-node-view";
import { Button } from "../button";
import { FileQuestion, Search, StickyNote, Trash2 } from "lucide-react";
import { useFlow } from "@/contexts/node-context";
import { cn, getNodeTypeColor, getRandomPosition } from "@/lib/utils";
import { PaperNode } from "@/lib/engine/nodes/paper-node";
import { QuestionNode } from "@/lib/engine/nodes/question-node";
import { useToast } from "@/hooks/use-toast";
import { connectNodes, GenericNode } from "@/lib/engine/nodes/generic-node";
import { ConceptNode } from "@/lib/engine/nodes/concept-node";
import ArxivAiSearchModal from "./arxiv-ai-search-modal";

function NodePicker({ nodeProps }: { nodeProps: NodeProps<FlowNode> }) {
  const { data } = nodeProps;
  switch (data.node.type) {
    case NodeType.CONCEPT:
      return <ConceptNodeView nodeProps={nodeProps} />;
    case NodeType.PAPER:
      return <PaperNodeView nodeProps={nodeProps} />;
    case NodeType.INSIGHT:
      return <InsightNodeView nodeProps={nodeProps} />;
    case NodeType.QUESTION:
      return <QuestionNodeView nodeProps={nodeProps} />;
    default:
      return (
        <div className="text-center">
          {data.node.type}: {data.node.id}
        </div>
      );
  }
}

export default function FlowNodeView(nodeProps: NodeProps<FlowNode>) {
  const { data } = nodeProps;
  const {
    onNodesChange,
    selectedNode,
    engine,
    nodes,
    addNode,
    addEdgeBetweenNodes,
  } = useFlow();
  const { toast } = useToast();
  const [isGeneratingFollowUpQuestions, setIsGeneratingFollowUpQuestions] =
    useState(false);

  const handleDelete = () => {
    onNodesChange([
      {
        id: nodeProps.id,
        type: "remove",
      },
    ]);
  };

  const handleAddConcept = () => {
    const node = selectedNode as FlowNode;
    if (!node) return;
    const { x, y } = getRandomPosition(node, 200);
    const newNode = addNode(new ConceptNode(""), {
      x,
      y,
    });
    addEdgeBetweenNodes(
      data.node as GenericNode,
      newNode.data.node as GenericNode
    );
  };

  // Only for paper nodes
  const handleGenerateFollowUpQuestionsFromPaper = async () => {
    try {
      setIsGeneratingFollowUpQuestions(true);
      const paperNode = data.node as PaperNode;
      const allQuestions = engine.nodes
        .filter((n) => n.type === NodeType.QUESTION)
        .map((n) => (n as QuestionNode).question);

      toast({
        title: "Generating follow-up questions",
        description: "Generating follow-up questions...",
        duration: 1000 * 60 * 10,
      });
      const response = await fetch(
        "/api/questions/generate-followup-questions-from-paper",
        {
          method: "POST",
          body: JSON.stringify({
            paperSummary: paperNode.aiSummary,
            questions: allQuestions,
          }),
        }
      );
      const followUpQuestions = await response.json();
      const newQuestionNodes = followUpQuestions.map(
        (q: string) => new QuestionNode(q)
      );

      const currentNode = nodes.find((n) => n.id === nodeProps.id);
      if (!currentNode) {
        throw new Error("Current node not found");
      }

      const numNodes = newQuestionNodes.length;
      const a =
        Math.min(currentNode.width ?? 200, currentNode.height ?? 100) / 2;
      const centerX = currentNode.position.x;
      const centerY = currentNode.position.y;

      newQuestionNodes.forEach((questionNode: QuestionNode, index: number) => {
        const mu = 3;
        const nu = (2 * Math.PI * index) / numNodes;

        const x = a * Math.cosh(mu) * Math.cos(nu);
        const y = a * Math.sinh(mu) * Math.sin(nu);

        addNode(questionNode, {
          x: centerX + x + (currentNode.width ?? 0) / 2,
          y: centerY + y + (currentNode.height ?? 0) / 2,
        });
      });

      newQuestionNodes.forEach((questionNode: QuestionNode) => {
        connectNodes(data.node, questionNode);
        addEdgeBetweenNodes(data.node, questionNode);
      });

      toast({
        title: "Follow-up questions generated",
        description: `${followUpQuestions.length} follow-up questions finished generating`,
        duration: 1000 * 5,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error generating follow-up questions",
        description: "An error occurred while generating follow-up questions",
        variant: "destructive",
        duration: 1000 * 5,
      });
    } finally {
      setIsGeneratingFollowUpQuestions(false);
    }
  };

  //   const handleAISearchFromQuestion = () => {
  //     console.log("Searching for answer from question");
  //   };

  return (
    <Fragment>
      <NodeToolbar className="flex flex-col gap-2" position={Position.Right}>
        {data.node.type === NodeType.PAPER &&
          ((data.node as PaperNode).notes ||
            (data.node as PaperNode).aiSummary) && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleGenerateFollowUpQuestionsFromPaper}
              disabled={isGeneratingFollowUpQuestions}
              className="hover:border-primary hover:text-primary relative group"
            >
              <FileQuestion />
              <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-20px] group-hover:translate-x-0 whitespace-nowrap">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent text-xs">
                  Follow-up questions
                </div>
              </div>
            </Button>
          )}
        {data.node.type === NodeType.QUESTION && (
          <ArxivAiSearchModal question={data.node as QuestionNode}>
            <Button
              variant="outline"
              size="icon"
              // onClick={handleAISearchFromQuestion}
              className="hover:border-primary hover:text-primary relative group"
              disabled={(data.node as QuestionNode).question.length === 0}
            >
              <Search />
              <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-20px] group-hover:translate-x-0 whitespace-nowrap">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent text-xs">
                  Search on ArXiv
                </div>
              </div>
            </Button>
          </ArxivAiSearchModal>
        )}
        <Button
          variant="outline"
          size="icon"
          className="hover:border-primary hover:text-primary relative group"
          onClick={handleAddConcept}
        >
          <StickyNote />
          <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-20px] group-hover:translate-x-0 whitespace-nowrap">
            <div className="bg-gradient-to-r from-white to-white bg-clip-text text-transparent text-xs">
              Add concept
            </div>
          </div>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hover:bg-destructive hover:text-destructive-foreground relative group"
          onClick={handleDelete}
        >
          <Trash2 />
          <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-20px] group-hover:translate-x-0 whitespace-nowrap">
            <div className="bg-gradient-to-r from-white to-white bg-clip-text text-transparent text-xs">
              Delete
            </div>
          </div>
        </Button>
      </NodeToolbar>
      <div
        className={cn(
          "flex flex-col divide-y shadow-md border max-w-sm",
          data.node.type === NodeType.PAPER && "bg-paperCard",
          data.node.type === NodeType.QUESTION && "bg-questionCard",
          data.node.type === NodeType.CONCEPT && "bg-card",
          selectedNode?.id === nodeProps.id && "border border-primary",
          selectedNode !== null &&
            selectedNode.id !== nodeProps.id &&
            "opacity-30"
        )}
      >
        <NodePicker nodeProps={nodeProps} />
        <div className="flex flex-row py-1.5 px-2 gap-4 justify-between bg-secondary items-center">
          <p
            className={cn(
              "text-xs font-bold",
              getNodeTypeColor(data.node.type)
            )}
          >
            {data.node.type}
          </p>
          <p className="text-xs text-muted-foreground italic">{data.node.id}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={true}
        style={{ width: 10, height: 10 }}
      />
    </Fragment>
  );
}
