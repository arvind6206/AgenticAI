import type { StructuredTool } from "@langchain/core/tools";
import type { AgentNodeConfig } from "@/modules/workflows/lib/schema";
import { isCustomToolConfig } from "@/modules/builder/lib/custom-tool";
import { buildCustomTool } from "./custom-http";
import { calculatorTool } from "./calculator";
import { readWebpageTool } from "./read-webpage";
import { weatherTool } from "./weather";
import { webSearchTool } from "./web-search";
import { getGithubToken } from "./github/token";
import { createGithubTools } from "./github";

const builtInTools: Record<string, StructuredTool> = {
  calculator: calculatorTool,
  weather: weatherTool,
  web_search: webSearchTool,
  read_webpage: readWebpageTool,
};

const githubToolIds = [
  "github_read_file",
  "github_search_code",
  "github_get_pr",
  "github_get_diff",
];

export async function getToolsForAgent(config: AgentNodeConfig, userId: string) {
  const tools: StructuredTool[] = [];
  const needsGithub = config.tools.some((t) => githubToolIds.includes(t.toolId));

  let githubTools: Record<string, StructuredTool> = {};
  if (needsGithub) {
    const token = await getGithubToken(userId);
    githubTools = createGithubTools(token, {
      owner: config.github?.owner,
      repo: config.github?.repo,
      defaultPrNumber: config.github?.defaultPrNumber,
    });
  }

  for (const t of config.tools) {
    if (isCustomToolConfig(t.config)) {
      tools.push(buildCustomTool(t.config));
      continue;
    }

    const builtIn = builtInTools[t.toolId] ?? githubTools[t.toolId];
    if (builtIn) {
      tools.push(builtIn);
    }
  }

  return tools;
}
