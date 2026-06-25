"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { deleteProblem } from "@/app/actions";
import { apiToggleProblemVisibility } from "@/lib/api";
import { problemListItemSchema } from "@/lib/schemas/problem";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onUpdate?: () => void;
}

export function DataTableRowActions<TData>({
  row,
  onUpdate,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isToggling, setIsToggling] = useState(false);

  const problem = useMemo(() => {
    const result = problemListItemSchema.safeParse(row.original);
    return result.success ? result.data : null;
  }, [row.original]);

  const onDeleteProblem = useCallback(async () => {
    if (!problem) {
      return;
    }

    try {
      const result = await deleteProblem(problem.id);
      if (result.status === "success") {
        toast.success(result.message);
        if (onUpdate) {
          onUpdate();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete problem");
    }
  }, [problem, onUpdate]);

  const onToggleVisibility = useCallback(async () => {
    if (!problem) {
      return;
    }

    if (!session?.nextjudge_token) {
      toast.error("Authentication required");
      return;
    }

    setIsToggling(true);
    try {
      await apiToggleProblemVisibility(session.nextjudge_token, problem.id);
      toast.success(`Problem ${problem.public ? 'made private' : 'made public'} successfully`);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to toggle problem visibility");
    } finally {
      setIsToggling(false);
    }
  }, [session?.nextjudge_token, problem, onUpdate]);

  if (!problem) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => {
            router.push(`/platform/admin/problems/edit/${problem.id}`);
          }}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onToggleVisibility}
          disabled={isToggling}
        >
          {problem.public ? 'Make Private' : 'Make Public'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            router.push(`/platform/problems/${problem.id}`);
          }}
        >
          View
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDeleteProblem}>
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
