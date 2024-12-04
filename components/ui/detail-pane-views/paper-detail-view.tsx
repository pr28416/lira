"use client";

import { PaperNode } from "@/lib/engine/nodes/paper-node";
import { Button } from "../button";
import { Fragment, useEffect, useState } from "react";
import { extractArxivId } from "@/lib/engine/services/arxiv/extract-arxiv-id";
import { PaperSummaryChunk } from "@/lib/engine/services/arxiv/types";
import { PaperSummaryProgress } from "@/lib/engine/services/arxiv/types";
import { PaperSummary } from "@/lib/engine/services/arxiv/types";
import { Progress } from "../progress";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Node } from "@xyflow/react";
import { useFlow } from "@/contexts/node-context";

// Component to display detailed information about a research paper node
export default function PaperDetailView({ node }: { node: Node }) {
  const paperNode = node.data.node as PaperNode;
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string>(
    paperNode.getAiSummary() ?? ""
  );
  const [percentComplete, setPercentComplete] = useState<number>(0);
  const { onNodesChange } = useFlow();

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
          <p className="text-muted-foreground text-xs mt-2 font-bold">
            AI Summary
          </p>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="text-foreground w-full prose-sm"
          >
            {aiSummary}
          </ReactMarkdown>
        </Fragment>
      )}
    </div>
  );
}
