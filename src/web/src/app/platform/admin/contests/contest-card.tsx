"use client";

import { Badge } from "@/components/ui/badge";
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
import { NextJudgeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";
import {
  Calendar,
  Clock,
  Edit,
  MoreVertical,
  Plus,
  Users
} from "lucide-react";

type ContestCardProps = {
  className?: string;
  contest: NextJudgeEvent;
  deleteContest?: (id: number) => void;
  editContest?: (contest: NextJudgeEvent) => void;
  mock?: boolean;
};

type ContestStatus = "upcoming" | "ongoing" | "ended";

export function ContestCard({
  className,
  contest,
  deleteContest,
  editContest,
  mock,
}: ContestCardProps) {
  const startTime = new Date(contest?.start_time);
  const endTime = new Date(contest?.end_time);
  const now = new Date();

  const status: ContestStatus = isBefore(now, startTime)
    ? "upcoming"
    : isAfter(now, endTime)
      ? "ended"
      : "ongoing";

  const getStatusConfig = () => {
    return {
      badge: "",
      accent: "bg-muted-foreground/20",
    };
  };

  const statusConfig = getStatusConfig();

  const getTimeDisplay = () => {
    switch (status) {
      case "upcoming":
        return `Starts ${formatDistanceToNow(startTime, { addSuffix: true })}`;
      case "ongoing":
        return `Ends ${formatDistanceToNow(endTime, { addSuffix: true })}`;
      case "ended":
        return `Ended ${formatDistanceToNow(endTime, { addSuffix: true })}`;
    }
  };

  const getDuration = () => {
    if (!contest?.start_time || !contest?.end_time) return "Unknown";

    const duration = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const problemCount = contest.problem_count ?? contest.problems?.length ?? 0;
  const participantCount = contest.participant_count ?? contest.participants?.length ?? 0;

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        className
      )}
    >

      <CardHeader className="pb-5 relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex items-start gap-3">
              <CardTitle className="text-2xl font-bold leading-tight">
                {contest?.title}
              </CardTitle>
            </div>
            <CardDescription className="text-sm leading-relaxed line-clamp-2 text-muted-foreground/80">
              {contest?.description}
            </CardDescription>
          </div>

          {!mock && (
            <div className="flex items-start gap-3 flex-shrink-0">
              <Badge
                variant="secondary"
                className="text-xs font-semibold px-3 py-1"
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => editContest && editContest(contest)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Plus className="mr-2 h-4 w-4" />
                    Add participant(s)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteContest && deleteContest(contest.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-0 relative">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{format(startTime, "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <Clock className="h-4 w-4" />
            <span>{format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{problemCount}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {problemCount === 1 ? "Problem" : "Problems"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{participantCount}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {participantCount === 1 ? "Participant" : "Participants"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{getDuration()}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Duration</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 bg-muted/30 px-3 py-2 rounded-md">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-medium">{getTimeDisplay()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

type ContestGridProps = {
  contests: NextJudgeEvent[];
  onDelete?: (id: number) => void;
  onEdit?: (contest: NextJudgeEvent) => void;
};

export function ContestGrid({ contests, onDelete, onEdit }: ContestGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {contests?.map((contest) => (
        <ContestCard
          key={contest.id}
          contest={contest}
          deleteContest={onDelete}
          editContest={onEdit}
        />
      ))}
    </div>
  );
}
