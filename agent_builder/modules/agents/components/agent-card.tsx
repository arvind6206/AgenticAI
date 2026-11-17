"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useDeleteAgent } from "@/modules/agents/hooks/use-agents";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AgentCardProps = {
  agent: {
    id: string;
    name: string;
    description: string;
    icon: string;
    updatedAt: Date;
  };
};

export function AgentCard({ agent }: AgentCardProps) {
  const deleteAgent = useDeleteAgent();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{agent.icon}</span>
          {agent.name}
        </CardTitle>
        <CardDescription>{agent.description || "No description yet"}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs">
          Updated {formatDistanceToNow(agent.updatedAt, { addSuffix: true })}
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button render={<Link href={`/agents/${agent.id}/builder`} />} nativeButton={false}>
          Open
        </Button>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" />}>Delete</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &quot;{agent.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                This deletes the agent and all its test chats. You can&apos;t undo this.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {/* Once deleted, this card (and the dialog) disappears from the list. */}
              <AlertDialogAction
                variant="destructive"
                disabled={deleteAgent.isPending}
                onClick={() => deleteAgent.mutate(agent.id)}
              >
                {deleteAgent.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
