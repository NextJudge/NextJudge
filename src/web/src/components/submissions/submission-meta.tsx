import { Submission } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function formatSubmissionRuntime(timeElapsed: number): string {
  if (!timeElapsed || timeElapsed <= 0) {
    return "—";
  }
  return `${Math.round(timeElapsed * 1000)} ms`;
}

export function formatSubmissionMemory(memoryUsed?: number): string | null {
  if (memoryUsed === undefined || memoryUsed <= 0) {
    return null;
  }
  if (memoryUsed >= 1024 * 1024) {
    return `${(memoryUsed / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (memoryUsed >= 1024) {
    return `${Math.round(memoryUsed / 1024)} KB`;
  }
  return `${memoryUsed} B`;
}

interface SubmissionMetaProps {
  submission: Submission;
  className?: string;
}

export function SubmissionMeta({ submission, className }: SubmissionMetaProps) {
  const memoryLabel = formatSubmissionMemory(submission.memory_used);

  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-4",
        className
      )}
    >
      <div>
        <dt className="text-xs text-muted-foreground">Status</dt>
        <dd className="font-medium">{submission.status.replaceAll("_", " ")}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Runtime</dt>
        <dd className="font-medium tabular-nums">
          {formatSubmissionRuntime(submission.time_elapsed)}
        </dd>
      </div>
      {memoryLabel && (
        <div>
          <dt className="text-xs text-muted-foreground">Memory</dt>
          <dd className="font-medium tabular-nums">{memoryLabel}</dd>
        </div>
      )}
      <div>
        <dt className="text-xs text-muted-foreground">Language</dt>
        <dd>
          <Badge variant="secondary" className="font-mono text-xs">
            {submission.language.name}
          </Badge>
        </dd>
      </div>
    </dl>
  );
}
