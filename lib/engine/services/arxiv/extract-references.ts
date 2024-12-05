import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { getPaginatedPDFTextFromArxivLink } from "./get-raw-pdf-text-from-arxiv";
import { openai } from "@/lib/ai/openai";
import { z } from "zod";
import { PaperMetadata } from "../../types";
import { createPaperNodeFromArxiv } from "../nodes/paper-node-ops";
import { PaperNode } from "../../nodes/paper-node";
import { ExtractReferencesResponse } from "./types";

export async function extractReferences(
  arxivLink: string
): Promise<ExtractReferencesResponse> {
  // Fetch the text of all pages
  const pageTexts = (await getPaginatedPDFTextFromArxivLink(arxivLink)).filter(
    (text) => text.toLowerCase().includes("arxiv")
  );

  // Process each page in parallel using GPT
  const urlsByPage = await Promise.all(
    pageTexts.map(async (pageText) => {
      const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Extract all paper URLs from the given text. Return them as a JSON array of strings. Only include valid http:// or https:// URLs. There may be inconsistent spacing within URLs, so take this into account. Only include URLs that are clearly URLs, not things like email addresses or other non-URL strings. Only include URLs that are clearly specific to papers, not things like the author's website or other non-paper URLs.",
          },
          {
            role: "user",
            content: pageText,
          },
        ],
        response_format: zodResponseFormat(
          z.object({
            urls: z.array(z.string()),
          }),
          "urls"
        ),
      });

      try {
        const response = completion.choices[0].message.parsed;
        return response?.urls || [];
      } catch (e) {
        console.error("Failed to parse GPT response:", e);
        return [];
      }
    })
  );

  // Combine all URLs from all pages and remove duplicates
  const urls = [...new Set(urlsByPage.flat())];

  // Filter to Arxiv
  const arxivPaperMetadata = await Promise.all(
    urls
      .filter((url) => url.toLowerCase().includes("arxiv"))
      .map((url) => createPaperNodeFromArxiv(url))
  );
  const nonArxivUrls = urls.filter(
    (url) => !url.toLowerCase().includes("arxiv")
  );

  return {
    papers: arxivPaperMetadata
      .filter((paper): paper is PaperNode => paper !== null)
      .map((paper) => paper.rawPaperMetadata)
      .filter((paper): paper is PaperMetadata => paper !== null),
    nonPapers: nonArxivUrls,
  };
}
