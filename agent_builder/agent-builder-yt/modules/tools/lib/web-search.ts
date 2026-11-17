import { tool } from "@langchain/core/tools";
import { tavily } from "@tavily/core";
import { z } from "zod";

export const webSearchTool = tool(
  async ({ query }) => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return "Web search is not configured. Add TAVILY_API_KEY to .env";
    }

    const client = tavily({ apiKey });
    const data = await client.search(query, { maxResults: 5 });

    return JSON.stringify(
      data.results.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
      }))
    );
  },
  {
    name: "web_search",
    description: "Search the web for recent information",
    schema: z.object({
      query: z.string().describe("Search query"),
    }),
  }
);
