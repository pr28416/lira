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
import { PaperMetadata } from "@/lib/engine/types";
import {
  ExternalLinkIcon,
  Link,
  Loader2,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import {
  getNewNodePositions,
  getRandomPosition,
  loadCitedPapers,
} from "@/lib/utils";

// Component to display detailed information about a research paper node
export default function PaperDetailView({ node }: { node: Node }) {
  const paperNode = node.data.node as PaperNode;
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isLoadingCitedPapers, setIsLoadingCitedPapers] =
    useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string>(
    paperNode.getAiSummary() ?? ""
  );
  const [percentComplete, setPercentComplete] = useState<number>(0);
  const { nodes, onNodesChange, addNode, addEdgeBetweenNodes } = useFlow();
  const [isAddingConcepts, setIsAddingConcepts] = useState<boolean>(false);
  const conceptGenerationToast = useToast();

  useEffect(() => {
    setAiSummary(paperNode.getAiSummary() ?? "");
  }, [paperNode.aiSummary]);

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

              const newPositions = getNewNodePositions(
                node.position.x,
                node.position.y,
                rawNodes.length,
                Math.min(node.width ?? 200, node.height ?? 100) // Semi-major axis
              );

              rawNodes.forEach((conceptNode, index) => {
                addNode(conceptNode, newPositions[index]);
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

  const handleAddCitedPaperToGraph = (paper: PaperMetadata) => {
    const newPaperNode = new PaperNode(paper);

    const { x, y } = getRandomPosition(node, 200);
    addNode(newPaperNode, { x, y });
    addEdgeBetweenNodes(paperNode, newPaperNode);
  };

  const handleRemoveCitedPaper = (paper: PaperMetadata) => {
    paperNode.citedArxivPapers = paperNode.citedArxivPapers.filter(
      (p) => p.URL !== paper.URL
    );
    onNodesChange([
      {
        id: paperNode.id,
        type: "replace",
        item: {
          id: paperNode.id,
          data: { node: paperNode },
          type: "flowNode",
          position: node.position,
        },
      },
    ]);
  };

  return (
    // Main container with vertical layout and spacing
    <div className="flex flex-col gap-2 h-[90%]">
      {/* Title and authors section */}
      <div className="flex flex-col gap-1 font-bold">
        {/* Paper title */}
        <div className="flex flex-row gap-1">
          <p className="text-lg font-bold">
            {paperNode.rawPaperMetadata?.title}
          </p>
          <Button variant="outline" size="icon" asChild>
            <a
              aria-label="Open paper in new tab"
              href={paperNode.rawPaperMetadata?.URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          </Button>
        </div>
        {/* Authors list with muted appearance */}
        <p className="text-xs text-muted-foreground">
          {paperNode.rawPaperMetadata?.authors
            ? paperNode.rawPaperMetadata.authors.join(", ").length > 20
              ? paperNode.rawPaperMetadata.authors
                  .slice(
                    0,
                    paperNode.rawPaperMetadata.authors
                      .join(", ")
                      .lastIndexOf(",", 20)
                  )
                  .join(", ") + " et al."
              : paperNode.rawPaperMetadata.authors.join(", ")
            : "Unknown authors"}
        </p>
      </div>
      {/* Paper abstract with smaller text and relaxed line height */}
      <p className="text-xs leading-relaxed">
        {paperNode.rawPaperMetadata?.abstract}
      </p>

      <Tabs defaultValue="paper_summary" className="h-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="paper_summary">Paper summary</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>
        <TabsContent value="notes" className="h-full">
          <div className="flex flex-col gap-2 h-full">
            <textarea
              placeholder="Add notes about this paper..."
              className="w-full bg-transparent border border-white/20 rounded-lg p-2 outline-none resize-none h-full"
              defaultValue={paperNode.notes}
              onChange={(e) => {
                paperNode.notes = e.target.value;
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="paper_summary">
          <div className="flex flex-col gap-2 pb-4">
            {/* AI summary section */}
            {!aiSummary && (
              <Button
                variant="outline"
                onClick={handleSummarizePaper}
                disabled={isSummarizing}
              >
                Summarize paper with AI
              </Button>
            )}

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
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                  }}
                  className="text-foreground w-full prose-sm prose-a:text-blue-500"
                >
                  {aiSummary}
                </ReactMarkdown>
              </Fragment>
            )}
          </div>
        </TabsContent>
        <TabsContent value="references">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row justify-between">
              <p className="text-muted-foreground text-xs font-bold mt-2">
                Most useful ArXiv papers cited by this paper
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadCitedPapers(
                    paperNode,
                    node,
                    onNodesChange,
                    setIsLoadingCitedPapers
                  );
                }}
                disabled={isLoadingCitedPapers}
              >
                {isLoadingCitedPapers ? (
                  <>
                    Loading... <Loader2 className="w-4 h-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Reload <RefreshCcw className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {paperNode.citedArxivPapers.map((paper, id) => (
                <div
                  key={id}
                  className="flex flex-col gap-1 bg-secondary rounded border p-2"
                >
                  <div className="flex justify-between">
                    <p className="text-sm font-semibold">{paper.title}</p>
                    <div className="flex flex-row gap-2">
                      {nodes.find(
                        (n) =>
                          (n.data.node as PaperNode).rawPaperMetadata?.title ===
                          paper.title
                      ) ? null : (
                        <Button
                          size="icon"
                          className="h-8 w-8 rounded-full min-h-8 min-w-8"
                          onClick={() => handleAddCitedPaperToGraph(paper)}
                        >
                          <span className="text-xl">+</span>
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 min-h-8 min-w-8"
                        onClick={() => handleRemoveCitedPaper(paper)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {paper.authors && (
                    <p className="text-xs text-muted-foreground">
                      {paper.authors?.length > 2
                        ? `${paper.authors[0]} et al.`
                        : paper.authors?.join(", ") || "Unknown authors"}
                    </p>
                  )}
                  <p className="text-xs">{paper.abstract}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
