"use client";

import { PaperNode } from "@/lib/engine/nodes/paper-node";
import { Button } from "../button";
import { Fragment, useEffect, useState } from "react";
import { extractArxivId } from "@/lib/engine/services/arxiv/extract-arxiv-id";
import {
  ConceptGenerationProgress,
  PaperSummaryChunk,
} from "@/lib/engine/services/arxiv/types";
import { PaperSummaryProgress } from "@/lib/engine/services/arxiv/types";
import { PaperSummary } from "@/lib/engine/services/arxiv/types";
import { Progress } from "../progress";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Node } from "@xyflow/react";
import { useFlow } from "@/contexts/node-context";
import { useToast } from "@/hooks/use-toast";
import {
  ConceptNodeData,
  createConceptNodesFromData,
} from "@/lib/engine/nodes/concept-node";
import { connectNodes } from "@/lib/engine/nodes/generic-node";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";

// Component to display detailed information about a research paper node
export default function PaperDetailView({ node }: { node: Node }) {
  const paperNode = node.data.node as PaperNode;
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string>(
    paperNode.getAiSummary() ?? ""
  );
  const [percentComplete, setPercentComplete] = useState<number>(0);
  const { onNodesChange, addNode, addEdgeBetweenNodes } = useFlow();
  const [isAddingConcepts, setIsAddingConcepts] = useState<boolean>(false);
  const conceptGenerationToast = useToast();

  useEffect(() => {
    console.log(
      "Setting ai summary",
      (node.data.node as PaperNode).getAiSummary()
    );
    setAiSummary((node.data.node as PaperNode).getAiSummary() ?? "");
  }, [node]);

  const handleSummarizePaper = async () => {
    try {
      setPercentComplete(0);
      const arxivLink = paperNode.rawPaperMetadata?.URL;
      setIsSummarizing(true);
      if (!extractArxivId(arxivLink ?? "")) {
        return;
      }
      const response = await fetch("/api/arxiv/summarize-pdf", {
        method: "POST",
        body: JSON.stringify({ arxivLink }),
      });

      const reader = response.body?.getReader();

      while (true) {
        const { done, value } = (await reader?.read()) ?? {};
        if (done) break;

        // Each chunk will contain complete JSON lines
        const lines = new TextDecoder().decode(value).split("\n");

        for (const line of lines) {
          if (line.trim()) {
            const update:
              | PaperSummaryChunk
              | PaperSummaryProgress
              | PaperSummary = JSON.parse(line);
            if ("progress" in update) {
              setPercentComplete((100 * update.progress) / update.total);
            } else if ("summaryChunk" in update) {
              // console.log("Got new summary chunk", update.summaryChunk);
              setAiSummary((prev) => prev + update.summaryChunk);
            } else if ("pageSummaries" in update) {
              console.log("Got final summary");
              setAiSummary(update.summary);
              paperNode.setAiSummary(update.summary);
              onNodesChange([
                {
                  id: paperNode.id,
                  type: "replace",
                  item: {
                    id: paperNode.id,
                    data: { node: paperNode },
                    type: "flowNode",
                    position: {
                      x: node.position.x,
                      y: node.position.y,
                    },
                  },
                },
              ]);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error summarizing paper", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAddConceptsToGraph = async () => {
    try {
      setIsAddingConcepts(true);
      console.log("Adding concepts to graph");

      const response = await fetch("/api/arxiv/generate-concepts-from-paper", {
        method: "POST",
        body: JSON.stringify({ summary: aiSummary }),
      });

      const reader = response.body?.getReader();

      while (true) {
        const { done, value } = (await reader?.read()) ?? {};
        if (done) break;

        const lines = new TextDecoder().decode(value).split("\n");

        for (const line of lines) {
          if (line.trim()) {
            const update: ConceptGenerationProgress | ConceptNodeData[] =
              JSON.parse(line);

            if ("title" in update) {
              conceptGenerationToast.dismiss();
              conceptGenerationToast.toast({
                title: update.title,
                description: update.description,
                duration: 2 * 60 * 1000,
              });
            } else {
              const rawNodes = createConceptNodesFromData(update);
              console.log("Got new concepts", rawNodes);
              conceptGenerationToast.dismiss();
              conceptGenerationToast.toast({
                title: "Concepts generated",
                description: `${rawNodes.length} concepts generated`,
                duration: 5 * 1000,
              });

              const numNodes = rawNodes.length;
              const a = Math.min(node.width ?? 200, node.height ?? 100) / 2; // Semi-major axis
              const centerX = node.position.x;
              const centerY = node.position.y;

              rawNodes.forEach((conceptNode, index) => {
                // Use μ (mu) and ν (nu) as our elliptic coordinates
                // We'll keep μ constant to place nodes on the same ellipse
                const mu = 3; // Constant value determines the size of the ellipse
                const nu = (2 * Math.PI * index) / numNodes; // Varies around the ellipse

                // Convert elliptic coordinates to Cartesian using the standard equations:
                // x = a * cosh(μ) * cos(ν)
                // y = a * sinh(μ) * sin(ν)
                const x = a * Math.cosh(mu) * Math.cos(nu);
                const y = a * Math.sinh(mu) * Math.sin(nu);

                addNode(conceptNode, {
                  x: centerX + x + (node.width ?? 0) / 2,
                  y: centerY + y + (node.height ?? 0) / 2,
                });
              });

              rawNodes.forEach((conceptNode) => {
                connectNodes(paperNode, conceptNode);
                addEdgeBetweenNodes(paperNode, conceptNode);
              });

              rawNodes.forEach((conceptNode) => {
                conceptNode.neighbors.forEach((neighbor) => {
                  addEdgeBetweenNodes(conceptNode, neighbor);
                });
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error adding concepts to graph", error);
    } finally {
      setIsAddingConcepts(false);
    }
  };

  return (
    // Main container with vertical layout and spacing
    <div className="flex flex-col gap-2">
      {/* Title and authors section */}
      <div className="flex flex-col gap-1 font-bold">
        {/* Paper title */}
        <p>{paperNode.rawPaperMetadata?.title}</p>
        {/* Authors list with muted appearance */}
        <p className="text-xs text-muted-foreground">
          {paperNode.rawPaperMetadata?.authors?.join(", ") || "Unknown authors"}
        </p>
      </div>
      {/* Paper abstract with smaller text and relaxed line height */}
      <p className="text-xs leading-relaxed">
        {paperNode.rawPaperMetadata?.abstract}
      </p>

      <Tabs defaultValue="paper_summary">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="paper_summary">Paper summary</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>
        <TabsContent value="paper_summary">
          <div className="flex flex-col gap-2">
            {/* AI summary section */}
            <Button
              variant="outline"
              onClick={handleSummarizePaper}
              disabled={isSummarizing}
            >
              Summarize paper with AI
            </Button>

            {isSummarizing && <Progress value={percentComplete} />}

            {aiSummary && (
              <Fragment>
                <div className="flex flex-row justify-between mt-2 items-center">
                  <p className="text-muted-foreground text-xs font-bold">
                    AI Summary
                  </p>
                  {aiSummary.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleAddConceptsToGraph}
                      size="sm"
                      disabled={isAddingConcepts}
                    >
                      Add concepts to graph
                    </Button>
                  )}
                </div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="text-foreground w-full prose-sm"
                >
                  {aiSummary}
                </ReactMarkdown>
              </Fragment>
            )}
          </div>
        </TabsContent>
        <TabsContent value="references">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs font-bold mt-2">
              ArXiv papers cited by this paper
            </p>
            <div className="flex flex-col gap-2">
              {paperNode.citedArxivPapers.map((paper, id) => (
                <div
                  key={id}
                  className="flex flex-col gap-1 bg-secondary rounded border p-2"
                >
                  <p className="text-sm font-semibold">{paper.title}</p>
                  {paper.authors && (
                    <p className="text-xs text-muted-foreground">
                      {paper.authors?.length > 2
                        ? `${paper.authors[0]} et al.`
                        : paper.authors?.join(", ") || "Unknown authors"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
