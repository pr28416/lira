export function extractArxivId(url: string): string {
  // Match either standard arXiv ID format or ID from DOI URL
  const arxivRegex = /(?:arXiv\.)(\d+\.\d+)|(?:arxiv.org\/abs\/)(\d+\.\d+)/i;
  const match = url.match(arxivRegex);
  // Return the captured group (either from DOI format or direct arXiv URL)
  return match ? match[1] || match[2] : "";
}
