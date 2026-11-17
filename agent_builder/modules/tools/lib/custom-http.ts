import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { toToolName, type CustomToolConfig } from "@/modules/builder/lib/custom-tool";

function fillTemplate(template: string, params: Record<string, unknown>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? ""));
}

export function buildCustomTool(config: CustomToolConfig) {
  const paramSchema: Record<string, z.ZodType> = {};

  for (const param of config.parameters) {
    let field: z.ZodType =
      param.type === "number"
        ? z.number()
        : param.type === "boolean"
          ? z.boolean()
          : z.string();

    if (!param.required) {
      field = field.optional();
    }

    paramSchema[param.name] = field.describe(param.description);
  }

  return tool(
    async (params) => {
      const values = params as Record<string, unknown>;
      const url = fillTemplate(config.url, values);
      const headers: Record<string, string> = {};

      for (const h of config.headers) {
        if (h.key) headers[h.key] = fillTemplate(h.value, values);
      }

      const options: RequestInit = {
        method: config.method,
        headers,
        signal: AbortSignal.timeout(config.timeoutMs),
      };

      if (config.method !== "GET" && config.body) {
        options.body = fillTemplate(config.body, values);
      }

      const res = await fetch(url, options);
      const text = await res.text();

      if (!res.ok) {
        return `Request failed with status ${res.status}: ${text.slice(0, 2000)}`;
      }

      return text.slice(0, 8000);
    },
    {
      name: toToolName(config.name),
      description: config.description,
      schema: z.object(paramSchema),
    }
  );
}
