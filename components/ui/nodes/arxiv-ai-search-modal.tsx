"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode, useEffect, useState } from "react";
import { DialogHeader } from "../dialog";
import { Button } from "../button";
import { PaperMetadata } from "@/lib/engine/types";
import { QuestionNode } from "@/lib/engine/nodes/question-node";
import { Minus, Plus, RefreshCcw } from "lucide-react";
import { AiSearchArxivProgressResponse } from "@/lib/engine/services/arxiv/types";
import { AiSearchArxivResponse } from "@/lib/engine/services/arxiv/types";
import { cn, getNewNodePositions, getRandomPosition } from "@/lib/utils";
import { useFlow } from "@/contexts/node-context";
import { PaperNode } from "@/lib/engine/nodes/paper-node";

export default function ArxivAiSearchModal({
  question,
  children,
}: {
  question: QuestionNode;
  children: ReactNode;
}) {
  const [results, setResults] = useState<PaperMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedResultUrls, setSelectedResultUrls] = useState<string[]>([]);
  const { nodes, onNodesChange, addNode, addEdgeBetweenNodes } = useFlow();

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setMessage("Searching ArXiv...");
      const response = await fetch("/api/arxiv/ai-search", {
        method: "POST",
        body: JSON.stringify({ query: question.question, maxResults: 10 }),
      });

      const reader = response.body?.getReader();

      while (true) {
        const { done, value } = (await reader?.read()) ?? {};
        if (done) break;

        // Process each line in the chunk
        const lines = new TextDecoder().decode(value).split("\n");

        for (const line of lines) {
          if (line.trim()) {
            const update:
              | AiSearchArxivResponse
              | AiSearchArxivProgressResponse = JSON.parse(line);
            if ("attemptNumber" in update) {
              setMessage(
                `Searching "${update.nextAiSearchQuery}" (${update.totalPapersFound} total papers scraped)...`
              );
            } else if ("paperMetadata" in update) {
              setResults(update.paperMetadata);
              setMessage(`Found ${update.paperMetadata.length} results`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error searching ArXiv", error);
      setMessage("Error searching ArXiv");
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      handleSearch();
    }
  };

  const handleSelectResult = (url: string) => {
    if (selectedResultUrls.includes(url)) {
      setSelectedResultUrls((prev) => prev.filter((u) => u !== url));
    } else {
      setSelectedResultUrls((prev) => [...prev, url]);
    }
  };

  const handleAddResults = () => {
    const questionNode = nodes.find((node) => node.id === question.id);
    if (!questionNode) return;

    console.log("Question node", questionNode);

    const newPositions = getNewNodePositions(
      questionNode.position.x,
      questionNode.position.y,
      selectedResultUrls.length,
      Math.min(questionNode.width ?? 200, questionNode.height ?? 100) / 2 // Semi-major axis
    );
    selectedResultUrls.forEach((url, index) => {
      const paperMetadata = results.find((paper) => paper.URL === url);
      console.log("Adding paper", paperMetadata);
      if (paperMetadata) {
        const paperNode = new PaperNode(paperMetadata);
        addNode(paperNode, newPositions[index]);
        addEdgeBetweenNodes(question, paperNode);
      }
    });
  };

  useEffect(() => {
    setSelectedResultUrls([]);
  }, [question, results]);

  return (
    <Dialog onOpenChange={handleOpenChange}>
      {/* Trigger */}
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* Content */}
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Search ArXiv</DialogTitle>
          <DialogDescription>
            Search ArXiv for papers related to the question.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-row justify-between items-center">
          {message && <p className="text-sm">{message}</p>}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full min-h-8 min-w-8"
            disabled={isSearching}
            onClick={handleSearch}
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-2 text-foreground max-h-[500px] overflow-y-scroll">
          {results.map((paper, id) => (
            <a
              key={id}
              className="flex flex-col gap-1 bg-secondary rounded border p-2 hover:bg-accent transition-all"
              href={paper.URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex justify-between">
                <p className="text-sm font-semibold">{paper.title}</p>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-8 w-8 min-h-8 min-w-8",
                    selectedResultUrls.includes(paper.URL) &&
                      "bg-destructive hover:bg-destructive/80"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectResult(paper.URL);
                  }}
                >
                  {selectedResultUrls.includes(paper.URL) ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {paper.authors && (
                <p className="text-xs text-muted-foreground">
                  {paper.authors?.length > 2
                    ? `${paper.authors[0]} et al.`
                    : paper.authors?.join(", ") || "Unknown authors"}
                </p>
              )}
              <p className="text-xs">{paper.abstract}</p>
            </a>
          ))}
        </div>
        <DialogClose asChild>
          <Button
            variant="outline"
            disabled={selectedResultUrls.length === 0 || isSearching}
            onClick={handleAddResults}
          >
            Add {selectedResultUrls.length} result
            {selectedResultUrls.length === 1 ? "" : "s"}
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
