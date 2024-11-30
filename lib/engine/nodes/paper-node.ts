import { GenericNode } from "./generic-node";
import { NodeType, PaperMetadata } from "../types";
import { openai } from "@/lib/ai/openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

export class PaperNode extends GenericNode {
  rawPaperMetadata: PaperMetadata | null;

  constructor(rawPaperMetadata: PaperMetadata) {
    super(NodeType.PAPER);
    this.rawPaperMetadata = rawPaperMetadata;
  }

  getAiStringDescription(): string {
    return `Paper ID: ${this.id || ""}\nPaper: ${
      this.rawPaperMetadata?.title || ""
    }\nAbstract: ${this.rawPaperMetadata?.abstract || ""}`;
  }
}

function extractArxivId(url: string): string {
  // Match either standard arXiv ID format or ID from DOI URL
  const arxivRegex = /(?:arXiv\.)(\d+\.\d+)|(?:arxiv.org\/abs\/)(\d+\.\d+)/i;
  const match = url.match(arxivRegex);
  // Return the captured group (either from DOI format or direct arXiv URL)
  return match ? match[1] || match[2] : "";
}

export async function createPaperNodeFromDOI(
  doi: string
): Promise<PaperNode | null> {
  // Clean the DOI by removing any prefixes
  const cleanDoi = doi.replace("https://doi.org/", "");

  // Make request to Crossref API
  const response = await fetch(`https://api.crossref.org/works/${cleanDoi}`, {
    headers: {
      "User-Agent": "ResearchAgent (mailto:pranav.ramesh1@gmail.com)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch DOI metadata: ${response.statusText}`);
  }

  const data = await response.json();
  const metadata = data.message;

  // Create paper node with extracted metadata
  return new PaperNode({
    DOI: cleanDoi,
    URL: `https://doi.org/${cleanDoi}`,
    title: (metadata.title?.[0] || "").replace(/<[^>]*>/g, ""),
    authors:
      metadata.author?.map(
        (author: { given: string; family: string }) =>
          `${author.given || ""} ${author.family || ""}`
      ) || [],
    abstract: (metadata.abstract || "").replace(/<[^>]*>/g, ""),
    publishDate: metadata.published?.["date-time"]
      ? new Date(metadata.published["date-time"])
      : undefined,
  });
}

export async function createPaperNodeFromArxiv(
  arxivId: string
): Promise<PaperNode | null> {
  // Get the arxivId from the arxiv url using regex
  const cleanId = extractArxivId(arxivId).trim();
  if (!cleanId) {
    return null;
  }

  const arxivResponse = await fetch(
    `http://export.arxiv.org/api/query?id_list=${cleanId}`
  );

  if (!arxivResponse.ok) {
    throw new Error(
      `Failed to fetch arXiv metadata: ${arxivResponse.statusText}`
    );
  }

  const arxivData = await arxivResponse.text();
  // console.log("arxivData", arxivData);

  // Get proper DOI
  let DOI = `10.48550/arXiv.${cleanId}`;
  if (arxivData.includes("arxiv:doi")) {
    const doiMatch = arxivData.match(
      /<arxiv:doi xmlns:arxiv="http:\/\/arxiv\.org\/schemas\/atom">(.*?)<\/arxiv:doi>/
    );
    DOI = doiMatch ? doiMatch[1] : DOI;
  }
  // Get title - modified to handle multiline titles
  const titleMatch = arxivData.match(/<title>([\s\S]*?)<\/title>/);
  const title = (titleMatch ? titleMatch[1] : "")
    .trim()
    .replace(/[\s\n]+/g, " ");

  // Get authors
  const authorMatches = arxivData.matchAll(
    /<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g
  );
  const authors = Array.from(authorMatches).map((match) => match[1].trim());

  // Get abstract - match summary tag content, handling multiline content with [\s\S]*?
  const abstractMatch = arxivData.match(/<summary>([\s\S]*?)<\/summary>/);
  const abstract = (abstractMatch ? abstractMatch[1] : "")
    .trim()
    .replace(/[\s\n]+/g, " ");

  // Get publish date
  const publishDateMatch = arxivData.match(/<published>(.*?)<\/published>/);
  const publishDateString = (
    publishDateMatch ? publishDateMatch[1] : ""
  ).trim();
  const publishDate = publishDateString
    ? new Date(publishDateString)
    : undefined;

  // Get keywords
  const keywordsResponse = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Given this academic paper abstract, identify 8-10 specific technical keywords or key phrases that best represent the main topics and contributions of the paper. Focus on technical terms, methodologies, and core concepts. Abstract: ${abstract}`,
      },
    ],
    response_format: zodResponseFormat(
      z.object({ keywordsDescribingPaper: z.array(z.string()) }),
      "keywordsDescribingPaper"
    ),
  });
  const keywords =
    keywordsResponse.choices[0]?.message?.parsed?.keywordsDescribingPaper;
  // Create paper node
  console.log("keywords", keywords);
  return new PaperNode({
    DOI: DOI,
    URL: `https://arxiv.org/abs/${cleanId}`,
    title: title,
    authors: authors,
    abstract: abstract,
    publishDate: publishDate,
    keywords: keywords || [],
  });
}

export async function createPaperNodeFromUrl(
  url: string
): Promise<PaperNode | null> {
  if (url.toLowerCase().includes("arxiv")) {
    return createPaperNodeFromArxiv(url);
  } else if (url.toLowerCase().includes("doi")) {
    return createPaperNodeFromDOI(url);
  }
  return null;
}
