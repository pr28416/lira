import { extractArxivId } from "./extract-arxiv-id";
import { openai } from "@/lib/ai/openai";
import { PaperSummary, PaperSummaryChunk, PaperSummaryProgress } from "./types";
import { getPaginatedPDFTextFromArxivLink } from "./get-raw-pdf-text-from-arxiv";

export function getPdfLinkFromArxiv(arxivLink: string) {
  const arxivId = extractArxivId(arxivLink);
  const pdfLink = `https://arxiv.org/pdf/${arxivId}.pdf`;
  return pdfLink;
}

async function summarizePage(
  page: number,
  pageText: string,
  tokensPerPage: number
) {
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
  maxTokens: number = 128000,
  maxSummaryTokens: number = 1024
): AsyncGenerator<PaperSummaryProgress | PaperSummaryChunk | PaperSummary> {
  const pageTexts = await getPaginatedPDFTextFromArxivLink(arxivLink);

  const tokensPerPage = Math.floor(
    (maxTokens - maxSummaryTokens) / pageTexts.length
  );

  let completedPages = 0;
  const totalPages = pageTexts.length;
  const pageSummaries: string[] = new Array(totalPages);

  // Create an array to track completion of each page
  const pagePromises = Array.from({ length: totalPages }, async (_, i) => {
    const pageText = pageTexts[i];

    if (pageText) {
      pageSummaries[i] = await summarizePage(i + 1, pageText, tokensPerPage);
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

  const overallSummaryPrompt = `Given these page-by-page summaries of an academic paper, provide a detailed but concise overall summary of the entire paper of all the important points in Markdown format. Do not include \`\`\`markdown or \`\`\` at the beginning or end of your response: ${pageSummaries.join(
    "\n\n"
  )}`;

  const overallCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: overallSummaryPrompt }],
    model: "gpt-4o-mini",
    max_tokens: maxSummaryTokens,
    stream: true,
  });

  const returnedPageSummaries: string[] = [];
  // const returnedPageSummaries = pageSummaries;

  let streamedSummary = "";
  for await (const chunk of overallCompletion) {
    const content = chunk.choices[0].delta.content || "";
    streamedSummary += content;

    yield {
      pageSummaries: returnedPageSummaries,
      summaryChunk: content,
    } as PaperSummaryChunk;
  }

  const final = {
    pageSummaries: returnedPageSummaries,
    summary: streamedSummary,
  } as PaperSummary;

  yield final;
  return final;
}
