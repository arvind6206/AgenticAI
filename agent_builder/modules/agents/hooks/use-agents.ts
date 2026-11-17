"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createBlankAgent,
  createFromTemplate,
  deleteAgent,
  fetchAgent,
  listAgents,
  saveAgent,
  type SaveAgentInput,
} from "@/modules/agents/actions";
import { agentKeys } from "@/modules/agents/lib/query-keys";
import { toast } from "@/components/ui/toast";

function showError(title: string) {
  return (error: Error) => toast.add({ title, description: error.message, type: "error" });
}

export function useAgents() {
  return useQuery({
    queryKey: agentKeys.list(),
    queryFn: listAgents,
  });
}

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: agentKeys.detail(agentId),
    queryFn: () => fetchAgent(agentId),
  });
}

export function useCreateBlankAgent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createBlankAgent,
    onSuccess: (agent) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.list() });
      router.push(`/agents/${agent.id}/builder`);
    },
    onError: showError("Could not create agent"),
  });
}

export function useCreateFromTemplate() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createFromTemplate,
    onSuccess: (agent) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.list() });
      router.push(`/agents/${agent.id}/builder`);
    },
    onError: showError("Could not create agent"),
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.list() });
      toast.add({ title: "Agent deleted", type: "success" });
    },
    onError: showError("Could not delete agent"),
  });
}

export function useSaveAgent(agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveAgentInput) => saveAgent(agentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.list() });
    },
  });
}
