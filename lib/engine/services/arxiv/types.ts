import { PaperMetadata } from "../../types";

export interface PaperSummaryChunk {
  pageSummaries: string[];
  summaryChunk: string;
}

export type PaperSummaryProgress = {
  progress: number;
  total: number;
};

export type PaperSummary = {
  pageSummaries: string[];
  summary: string;
};

export type ConceptGenerationProgress = {
  title: string;
  description: string;
};

export type ExtractReferencesResponse = {
  papers: PaperMetadata[];
  nonPapers: string[];
};
