"use client";

import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddNodeButtonOption } from "@/app/enums";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { PaperMetadata } from "@/lib/engine/types";
import { Input } from "@/components/ui/input";

export default function AddNodeButton({
  onClick,
}: {
  onClick?: (selectedOption: AddNodeButtonOption, content: unknown) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [retrievedPaper, setRetrievedPaper] = useState<PaperMetadata | null>(
    null
  );
  const [isRetrievingPaper, setIsRetrievingPaper] = useState(false);
  const [arxivId, setArxivId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleOptionClick = (option: AddNodeButtonOption) => {
    if (option === AddNodeButtonOption.PAPER) {
      setIsDialogOpen(true);
    } else {
      onClick?.(option, "");
    }
  };

  const retrievePaper = async () => {
    try {
      setIsRetrievingPaper(true);
      setMessage("Retrieving paper...");
      const response = await fetch("/api/create-paper-node-from-arxiv", {
        method: "POST",
        body: JSON.stringify({ arxivId }),
      });
      const paper: PaperMetadata = await response.json();
      setRetrievedPaper(paper);
      setMessage(null);
    } catch (error) {
      setRetrievedPaper(null);
      setMessage(`Error retrieving paper: ${error}`);
    } finally {
      setIsRetrievingPaper(false);
    }
  };

  const handleAddPaper = async () => {
    onClick?.(AddNodeButtonOption.PAPER, retrievedPaper);
    setIsDialogOpen(false);
    setRetrievedPaper(null);
    setArxivId("");
    setMessage(null);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-primary rounded-full" size="icon">
            <Plus className="" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Object.values(AddNodeButtonOption).map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Paper</DialogTitle>
          <DialogDescription>Enter the paper details below.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2">
            <Input
              placeholder="ArXiv ID"
              value={arxivId}
              onChange={(e) => setArxivId(e.target.value)}
            />
            <Button
              onClick={() => retrievePaper()}
              variant="outline"
              size="icon"
              disabled={isRetrievingPaper}
            >
              <Search />
            </Button>
          </div>
          {retrievedPaper && (
            <a
              className="flex flex-col gap-2 border rounded p-2 hover:opacity-70 transition-all"
              href={`https://doi.org/${retrievedPaper.DOI}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <p className="text-sm font-bold">{retrievedPaper.title}</p>
              <p className="text-xs text-muted-foreground">
                {retrievedPaper.authors
                  ? retrievedPaper.authors.join(", ").length > 20
                    ? retrievedPaper.authors
                        .slice(
                          0,
                          retrievedPaper.authors.join(", ").lastIndexOf(",", 20)
                        )
                        .join(", ") + " et al."
                    : retrievedPaper.authors.join(", ")
                  : "Unknown authors"}
              </p>
              {retrievedPaper.publishDate && (
                <p className="text-xs text-muted-foreground">
                  Published on{" "}
                  {new Date(retrievedPaper.publishDate).toLocaleDateString()}
                </p>
              )}
              <p className="text-xs">{retrievedPaper.abstract}</p>
            </a>
          )}
          {message && <p>{message}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleAddPaper} disabled={!retrievedPaper}>
            Add Paper
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
