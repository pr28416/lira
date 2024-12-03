export async function getAbstractFromArxivPaper(
  arxivPaperUrl: string
): Promise<string | null> {
  try {
    // Extract arXiv ID from URL
    const arxivId = extractArxivId(arxivPaperUrl);
    if (!arxivId) return null;

    // Fetch from arXiv API
    const response = await fetch(
      `http://export.arxiv.org/api/query?id_list=${encodeURIComponent(
        arxivId
      )}`,
      {
        headers: {
          "User-Agent": "YourApp (mailto:your@email.com)",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.text();
    // Extract abstract from XML response using regex
    const abstractMatch = data.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    return abstractMatch ? abstractMatch[1].trim() : null;
  } catch (error) {
    console.error("Error fetching paper abstract:", error);
    return null;
  }
}

function extractArxivId(url: string): string | null {
  try {
    // Common arXiv URL patterns
    const patterns = [
      /arxiv\.org\/abs\/([^\/\s]+)/, // arxiv.org/abs/2103.12345
      /arxiv\.org\/pdf\/([^\/\s]+)/, // arxiv.org/pdf/2103.12345
      /([^\/\s]+)$/, // Raw ID: 2103.12345
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        // Remove version number and .pdf extension if present
        return match[1].replace(/v\d+$/, "").replace(/\.pdf$/, "");
      }
    }

    return null;
  } catch {
    return null;
  }
}
