import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
export function EditorSkeleton() {
  return (
    <>
      <Skeleton
        className={cn(
          "min-h-[85dvh] min-w-full",
          "rounded-none dark:bg-neutral-900 "
        )}
      />
    </>
  );
}
