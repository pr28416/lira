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
