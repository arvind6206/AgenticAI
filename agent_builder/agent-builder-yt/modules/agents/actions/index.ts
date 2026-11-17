"use server";

import type { Edge, Node } from "@xyflow/react";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { requireAuth } from "@/modules/auth/actions";
import { migrateV1ToV2 } from "@/modules/workflows/lib/migrate-v1";
import {
  builderDefinitionSchema,
  defaultBuilderDefinition,
  type BuilderDefinition,
} from "@/modules/workflows/lib/schema";
import { getTemplate } from "../lib/templates";

export type SaveAgentInput = {
  name: string;
  description: string;
  draftDefinition: BuilderDefinition;
  canvas: { nodes: Node[]; edges: Edge[] };
};

export async function listAgents() {
  const user = await requireAuth();

  return prisma.agent.findMany({
    where: {
      userId: user.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function fetchAgent(agentId: string) {
  const user = await requireAuth();

  return prisma.agent.findFirst({
    where: { id: agentId, userId: user.user.id },
  });
}

export async function createBlankAgent() {
  const user = await requireAuth();

  return prisma.agent.create({
    data: {
      userId: user.user.id,
      name: "Untitled Agent",
      draftDefinition: defaultBuilderDefinition() as Prisma.InputJsonValue,
    },
  });
}

export async function createFromTemplate(templateId: string) {
  const user = await requireAuth();
  const template = getTemplate(templateId);

  if (!template) {
    throw new Error("Template not found");
  }

  return prisma.agent.create({
    data: {
      userId: user.user.id,
      templateId: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      welcomeMessage: template.welcomeMessage,
      starterPrompts: template.starterPrompts,
      // Templates are written in the simple V1 format; we store them as a V2 graph.
      draftDefinition: migrateV1ToV2(template.definition) as Prisma.InputJsonValue,
    },
  });
}

export async function deleteAgent(agentId: string) {
  const user = await requireAuth();

  await prisma.agent.deleteMany({
    where: { id: agentId, userId: user.user.id },
  });
}

export async function saveAgent(agentId: string, data: SaveAgentInput) {
  const user = await requireAuth();

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: user.user.id },
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  // Server actions can be called by anyone, so check the shape before saving.
  const draftDefinition = builderDefinitionSchema.parse(data.draftDefinition);

  return prisma.agent.update({
    where: { id: agentId },
    data: {
      name: data.name,
      description: data.description,
      draftDefinition: draftDefinition as Prisma.InputJsonValue,
      canvas: data.canvas as unknown as Prisma.InputJsonValue,
    },
  });
}
