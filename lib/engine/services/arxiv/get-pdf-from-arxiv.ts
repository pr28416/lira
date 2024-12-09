import { extractArxivId } from "./extract-arxiv-id";
import { openai } from "@/lib/ai/openai";
import { PaperSummary, PaperSummaryChunk, PaperSummaryProgress } from "./types";
import { getPaginatedPDFTextFromArxivLink } from "./get-raw-pdf-text-from-arxiv";

export function getPdfLinkFromArxiv(arxivLink: string) {
  const arxivId = extractArxivId(arxivLink);
  const pdfLink = `https://arxiv.org/pdf/${arxivId}.pdf`;
  return pdfLink;
}

async function summarizePage(page: number, pageText: string) {
  const prompt = `Summarize this page from an academic paper: "${pageText}"`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o-mini",
  });

  console.log(`Page ${page} processed`);
  return completion.choices[0].message.content || "";
}

export async function* getPaperSummary(
  arxivLink: string,
  maxSummaryTokens: number = 1024
): AsyncGenerator<PaperSummaryProgress | PaperSummaryChunk | PaperSummary> {
  const pageTexts = await getPaginatedPDFTextFromArxivLink(arxivLink);

  let completedPages = 0;
  const totalPages = pageTexts.length;
  const pageSummaries: string[] = new Array(totalPages);

  // Create an array to track completion of each page
  const pagePromises = Array.from({ length: totalPages }, async (_, i) => {
    const pageText = pageTexts[i];

    if (pageText) {
      pageSummaries[i] = await summarizePage(i + 1, pageText);
    } else {
      pageSummaries[i] = "";
    }
    return i;
  });

  // Use Promise.race to handle completions as they happen
  const remaining = new Set(pagePromises);
  while (remaining.size > 0) {
    const completedIndex = await Promise.race(remaining);
    remaining.delete(pagePromises[completedIndex]);
    completedPages++;
    yield {
      progress: completedPages,
      total: totalPages,
    } as PaperSummaryProgress;
  }

  const overallSummaryPrompt = `Given these page-by-page summaries of an academic paper, provide a detailed but concise overall summary of the entire paper of all the important points in Markdown format. For every sentence that you cite from a page, wrap that summarized sentence in a Markdown hyperlink. The format for such sentence should be of the form: "Your sentence here [start_citation]Number[end_citation]." If there are multiple pages that you cite from, then the format for such sentence should be of the form: "Your sentence here [start_citation]Number1, Number2, Number3, ...[end_citation]." Do not include \`\`\`markdown or \`\`\` at the beginning or end of your response: ${pageSummaries
    .map((summary, idx) => `Page ${idx + 1}: ${summary}`)
    .join("\n\n")}`;

  const overallCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: overallSummaryPrompt }],
    model: "gpt-4o-mini",
    max_tokens: maxSummaryTokens,
  });

  const returnedPageSummaries: string[] = [];
  // const returnedPageSummaries = pageSummaries;

  // let streamedSummary = "";
  // for await (const chunk of overallCompletion) {
  //   const content = chunk.choices[0].delta.content || "";
  //   streamedSummary += content;

  //   yield {
  //     pageSummaries: returnedPageSummaries,
  //     summaryChunk: content,
  //   } as PaperSummaryChunk;
  // }

  const pdfLink = getPdfLinkFromArxiv(arxivLink);

  let response = overallCompletion.choices[0].message.content || "";
  // Replace citations with PDF page links
  response = response.replace(
    /\[start_citation\](\d+(?:,\s*\d+)*)\[end_citation\]/g,
    (_, pages: string) => {
      // Handle multiple page numbers separated by commas
      const pageNumbers = pages
        .split(",")
        .map((p: string) => parseInt(p.trim()));

      // Create links for each page number
      return pageNumbers
        .map((pageNum: number) => `[(${pageNum})](${pdfLink}#page=${pageNum})`)
        .join(", ");
    }
  );

  const final = {
    pageSummaries: returnedPageSummaries,
    summary: response,
  } as PaperSummary;

  yield final;
  return final;
}
