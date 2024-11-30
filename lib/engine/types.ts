export enum NodeType {
  QUESTION = "question",
  PAPER = "paper",
  CONCEPT = "concept",
  INSIGHT = "insight",
}

export interface PaperMetadata {
  title: string;
  abstract?: string;
  authors?: string[];
  DOI: string;
  URL: string;
  publishDate?: Date;
  keywords?: string[];
}
