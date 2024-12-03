import { openai } from "@/lib/ai/openai";

export async function aiSearchArxiv(
  query: string,
  maxResults: number = 10
): Promise<string[]> {
  // First, get the optimized search query from GPT
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Given a user search request, transform it into the right ArXiv search query. Only return the query, no other text.",
      },
      { role: "user", content: query },
    ],
  });

  const searchQuery = response.choices[0].message.content;
  if (!searchQuery) return [];

  console.log("Search query:", searchQuery);

  try {
    // Construct ArXiv API URL with the search query
    const encodedQuery = encodeURIComponent(searchQuery);
    const apiUrl = `http://export.arxiv.org/api/query?search_query=${encodedQuery}&max_results=${maxResults}`;

    // Fetch results from ArXiv API
    const arxivResponse = await fetch(apiUrl);
    const data = await arxivResponse.text();

    // Parse XML response to extract article links
    const links: string[] = [];
    const matches = data.match(/<id>http:\/\/arxiv\.org\/abs\/.*?<\/id>/g);

    if (matches) {
      matches.forEach((match) => {
        // Extract the URL from the ID tag and convert to HTTPS
        const link = match
          .replace("<id>", "")
          .replace("</id>", "")
          .replace("http://", "https://");
        links.push(link);
      });
    }

    return links;
  } catch (error) {
    console.error("Error fetching ArXiv results:", error);
    return [];
  }
}
