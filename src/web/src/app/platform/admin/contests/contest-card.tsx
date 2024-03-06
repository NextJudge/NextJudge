"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  CircleIcon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";

import { Competition } from "@/types";
import { format } from "date-fns";
import { EditIcon } from "lucide-react";

type ContestCardProps = {
  className?: string;
  contest: Competition;
  deleteContest: (id: number) => void;
};

export function ContestCard({
  className,
  contest,
  deleteContest,
}: ContestCardProps) {
  const contestName = contest?.title;
  const contestDescription = contest?.description;
  const startTime = contest?.startTime;
  const endTime = contest?.endTime;
  const participants = contest?.participants?.length;
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-4 space-y-0">
        <div className="space-y-4">
          <CardTitle>{contestName}</CardTitle>
          <CardDescription>{contestDescription}</CardDescription>
        </div>
        <div className="flex items-center rounded-md bg-secondary text-secondary-foreground">
          <Separator orientation="vertical" className="h-[20px]" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="px-2 shadow-none">
                <ChevronDownIcon className="h-4 w-4 text-secondary-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              alignOffset={-5}
              className="w-[200px]"
              forceMount
            >
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteContest(contest.id)}>
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <EditIcon className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <PlusIcon className="mr-2 h-4 w-4" /> Add participant(s)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <CircleIcon className="mr-1 h-3 w-3 fill-sky-400 text-sky-400" />
            {contest.problems?.length} Problems
          </div>
          <div className="flex items-center">
            <PersonIcon className="mr-1 h-3 w-3" />
            {contest.participants?.length} Participants
          </div>

          <div>
            Begins {format(new Date(contest.startTime), "MMMM do, yyyy")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ContestGrid({ contests, onDelete }: any) {
  return (
    <div className="grid grid-cols-2 w-full gap-4">
      {contests?.map((contest: any) => (
        <ContestCard
          key={contest.id}
          contest={contest}
          deleteContest={onDelete}
        />
      ))}
    </div>
  );
}
