import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface SectionDividerProps {
  className?: string;
}

export const SectionDivider = ({ className }: SectionDividerProps) => {
  return (
    <div className={cn("relative w-full overflow-hidden py-4", className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-osu/50 to-transparent" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-primary/40 to-transparent blur-md" />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="bg-black p-1.5 rounded-full">
          <Icons.logo className="text-osu size-12 opacity-80" />
        </div>
      </div>
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2">
        <div className="h-0.5 w-0.5 rounded-full bg-osu/40 blur-sm" />
      </div>
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2">
        <div className="h-0.5 w-0.5 rounded-full bg-osu/40 blur-sm" />
      </div>
    </div>
  );
};
