import { tool } from "@langchain/core/tools";
import { tavily } from "@tavily/core";
import { z } from "zod";

export const readWebpageTool = tool(
  async ({ url }) => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return "Web page reading is not configured. Add TAVILY_API_KEY to .env";
    }

    const client = tavily({ apiKey });
    let data = await client.extract([url], { format: "text" });

    // Basic extract cannot fetch some JS-rendered sites (Tavily: "Failed to fetch url").
    if (data.results.length === 0) {
      data = await client.extract([url], {
        format: "text",
        extractDepth: "advanced",
      });
    }

    const page = data.results[0];
    if (!page?.rawContent) {
      const error = data.failedResults[0]?.error ?? "no content returned";
      return `Failed to read page: ${error}`;
    }

    return JSON.stringify({
      url: page.url,
      title: page.title,
      text: page.rawContent.slice(0, 8000),
    });
  },
  {
    name: "read_webpage",
    description: "Read and extract text from a webpage URL",
    schema: z.object({
      url: z.string().describe("Full webpage URL"),
    }),
  }
);
