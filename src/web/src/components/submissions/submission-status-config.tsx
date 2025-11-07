import { Badge } from "@/components/ui/badge";
import { statusMap, SubmissionStatus } from "@/lib/types";
import { Bug, Check, Code, Loader, MemoryStick, Timer, X } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface StatusConfig {
  label: string;
  icon: LucideIcon;
  className: string;
  borderClassName: string;
}

export const submissionStatusConfig: Record<SubmissionStatus | "PENDING", StatusConfig> = {
  ACCEPTED: {
    label: statusMap.ACCEPTED,
    icon: Check,
    className: "border-green-500 text-green-700 dark:text-green-400",
    borderClassName: "border-green-500",
  },
  WRONG_ANSWER: {
    label: statusMap.WRONG_ANSWER,
    icon: X,
    className: "border-red-500 text-red-700 dark:text-red-400",
    borderClassName: "border-red-500",
  },
  TIME_LIMIT_EXCEEDED: {
    label: statusMap.TIME_LIMIT_EXCEEDED,
    icon: Timer,
    className: "border-yellow-500 text-yellow-700 dark:text-yellow-400",
    borderClassName: "border-yellow-500",
  },
  MEMORY_LIMIT_EXCEEDED: {
    label: statusMap.MEMORY_LIMIT_EXCEEDED,
    icon: MemoryStick,
    className: "border-purple-500 text-purple-700 dark:text-purple-400",
    borderClassName: "border-purple-500",
  },
  RUNTIME_ERROR: {
    label: statusMap.RUNTIME_ERROR,
    icon: Bug,
    className: "border-pink-500 text-pink-700 dark:text-pink-400",
    borderClassName: "border-pink-500",
  },
  COMPILE_TIME_ERROR: {
    label: statusMap.COMPILE_TIME_ERROR,
    icon: Code,
    className: "border-orange-500 text-orange-700 dark:text-orange-400",
    borderClassName: "border-orange-500",
  },
  PENDING: {
    label: statusMap.PENDING,
    icon: Loader,
    className: "border-blue-500 text-blue-700 dark:text-blue-400",
    borderClassName: "border-yellow-500",
  },
};

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus | "PENDING";
  showIcon?: boolean;
  variant?: "default" | "detailed";
}

export function SubmissionStatusBadge({
  status,
  showIcon = false,
  variant = "default",
}: SubmissionStatusBadgeProps) {
  const config = submissionStatusConfig[status];
  const StatusIcon = config.icon;

  if (variant === "detailed") {
    return (
      <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
        {showIcon && (
          <StatusIcon
            className={`h-3.5 w-3.5 ${
              status === "PENDING" ? "animate-spin" : ""
            }`}
          />
        )}
        {config.label}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`text-xs whitespace-nowrap ${config.borderClassName} dark:text-muted-foreground font-medium text-secondary-foreground`}
    >
      {config.label}
    </Badge>
  );
}
