"use client";

import { RecentSubmissionCard } from "@/app/platform/problems/components/recent-submissions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Problem, Submission } from "@/lib/types";
import { Tag } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProblemSectionProps {
  details: Problem;
  tags: string[];
  slot: React.ReactNode;
  recentSubmissions: Submission[];
}

function formatDifficulty(difficulty?: string) {
  if (!difficulty) return "Unknown";
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

export function ProblemSection({
  details,
  tags,
  slot,
  recentSubmissions,
}: ProblemSectionProps) {
  const router = useRouter();

  return (
    <Tabs defaultValue="description" className="h-full flex flex-col">
      <TabsList className="flex justify-start w-full h-9 shrink-0 rounded-none bg-muted/40 p-1 mx-0">
        <TabsTrigger value="description" className="px-2 py-1 h-7">
          Description
        </TabsTrigger>
        <TabsTrigger value="submissions" className="px-2 py-1 h-7">
          Submissions
        </TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden select-none">
        <div className="flex flex-col h-full">
          <ScrollArea className="flex-1">
            <div className="flex flex-col p-4">
              <div className="flex justify-between items-center pt-1">
                <h1 className="text-2xl font-bold">
                  {details.id > 0 ? `${details.id}. ` : ""}
                  {details.title}
                </h1>
              </div>
              <div className="flex items-center flex-wrap gap-2 my-4">
                <Button size="sm" variant="secondary" className="h-7">
                  {formatDifficulty(details.difficulty)}
                </Button>
                {tags.length > 0 && (
                  <Button size="sm" variant="secondary" className="h-7 gap-1">
                    <Tag className="!w-3" /> Topics
                  </Button>
                )}
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => router.push(`/platform/problems?tag=${tag.toLowerCase()}`)}
                      className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              <div className="editor-prose flex flex-col space-y-3 text-sm">{slot}</div>
            </div>
          </ScrollArea>
        </div>
      </TabsContent>
      <TabsContent value="submissions" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {recentSubmissions.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentSubmissions.map((submission) => (
                  <RecentSubmissionCard submission={submission} key={submission.id} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
