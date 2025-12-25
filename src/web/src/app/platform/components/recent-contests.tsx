"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEventMetadata } from "@/hooks/useEventMetadata";
import { NextJudgeEvent } from "@/lib/types";
import { formatDistanceToNow, isAfter } from "date-fns";
import { ArrowRight, Calendar, FileCode, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface ContestCardProps {
  contest: NextJudgeEvent;
}

function ContestCard({ contest }: ContestCardProps) {
  const router = useRouter();
  const { problemCount } = useEventMetadata(contest);
  const now = new Date();
  const endTime = new Date(contest.end_time);
  const isEnded = isAfter(now, endTime);
  const participantCount = contest.participant_count || contest.participants?.length || 0;

  const handleCardClick = () => {
    router.push(`/platform/contests/${contest.id}`);
  };

  return (
    <Card
      className="p-5 hover:border-primary/50 transition-all cursor-pointer group max-w-md"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-3">
        <Badge
          variant="secondary"
          className="text-xs font-medium bg-muted text-muted-foreground"
        >
          {isEnded ? "Ended" : "Active"}
        </Badge>
        {contest.teams && (
          <Badge variant="outline" className="text-xs">
            Team
          </Badge>
        )}
      </div>
      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors text-balance">
        {contest.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
        {contest.description}
      </p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1.5">
          <FileCode className="h-3.5 w-3.5" />
          <span>
            {problemCount} {problemCount === 1 ? "Problem" : "Problems"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>{participantCount}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          {isEnded
            ? `Ended ${formatDistanceToNow(endTime, { addSuffix: true })}`
            : `Ends ${formatDistanceToNow(endTime, { addSuffix: true })}`}
        </span>
      </div>
    </Card>
  );
}

interface RecentContestsProps {
  contests: NextJudgeEvent[];
}

export function RecentContests({ contests }: RecentContestsProps) {
  const router = useRouter();
  const safeContests = Array.isArray(contests) ? contests : [];

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Recent Contests</h2>
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => router.push("/platform/contests")}
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      {safeContests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground mb-2">No contests available</div>
          <div className="text-sm text-muted-foreground">
            Check back later for upcoming contests
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </section>
  );
}
