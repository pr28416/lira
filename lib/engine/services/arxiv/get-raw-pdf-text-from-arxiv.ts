import { TextItem } from "pdfjs-dist/types/src/display/api";
import { getPdfLinkFromArxiv } from "./get-pdf-from-arxiv";
import * as pdfjsLib from "pdfjs-dist";

export async function getPaginatedPDFTextFromArxivLink(
  arxivLink: string
): Promise<string[]> {
  // Get PDF link from arXiv URL
  const pdfLink = getPdfLinkFromArxiv(arxivLink);

  // Fetch and load the PDF
  const response = await fetch(pdfLink);
  const arrayBuffer = await response.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;

  // Extract text from each page
  const totalPages = pdfDocument.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item): item is TextItem => "str" in item)
      .map((item) => item.str)
      .join(" ")
      .trim();

    pageTexts.push(pageText);
  }

  return pageTexts;
}
