"use client";

import { Button } from "@/components/ui/button";
import { ContestCard } from "@/components/contest-card";
import { NextJudgeEvent } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} variant="compact" />
          ))}
        </div>
      )}
    </section>
  );
}
