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
import {
  ChevronDownIcon,
  CircleIcon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Clock, EditIcon } from "lucide-react";
import { NextJudgeEvent } from "@/lib/types";

type ContestCardProps = {
  className?: string;
  contest: NextJudgeEvent;
  deleteContest?: (id: number) => void;
  mock?: boolean;
};

export function ContestCard({
  className,
  contest,
  deleteContest,
  mock,
}: ContestCardProps) {
  const contestName = contest?.title;
  const contestDescription = contest?.description;
  const startTime = contest?.start_time;
  const endTime = contest?.end_time;
  return (
    <Card className="max-w-[105%]">
      <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-4 space-y-0">
        <div className="space-y-4">
          <CardTitle>{contestName}</CardTitle>
          <CardDescription>{contestDescription}</CardDescription>
        </div>
        <div
          className={cn(
            "flex items-center rounded-md bg-secondary text-secondary-foreground w-full",
            {
              hidden: mock,
            }
          )}
        >
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
              <DropdownMenuItem
                onClick={() => deleteContest && deleteContest(contest.id)}
              >
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
      <CardContent className="w-full">
        <div className="flex flex-row items-center gap-6 text-sm text-muted-foreground">
          <div className="flex flex-col md:items-center gap-6 md:flex-row ">
            <div className="flex items-center flex-row">
              <CircleIcon className="mr-1 h-3 w-3 fill-osu text-osu" />
              {/* TODO: <p>{contest.problems?.length} Problems</p> */}
              <p>0 Problems</p>
            </div>
            <div className="flex items-center">
              <PersonIcon className="mr-1 h-3 w-3" />
              {/* TODO <p>{contest.participants?.length} Participants</p> */}
              <p>0 Participants</p>
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 size-4 md:mr-2 md:size-4" />
              <p className="w-[200%] md:w-full">0</p>
            </div>
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
