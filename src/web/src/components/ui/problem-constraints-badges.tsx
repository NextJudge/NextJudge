import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, HardDrive } from 'lucide-react';

interface ProblemConstraintsBadgesProps {
    executionTimeout: number;
    memoryLimit: number;
    className?: string;
}

export function ProblemConstraintsBadges({
    executionTimeout,
    memoryLimit,
    className
}: ProblemConstraintsBadgesProps) {
    const formatMemory = (bytes: number) => {
        return `${bytes}mb`;
    };

    const formatTime = (seconds: number) => {
        return `${seconds}s`;
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="flex gap-2 flex-wrap">
                <Badge
                    variant="outline"
                    className={cn("text-xs text-black dark:text-white border-blue-500 flex items-center gap-1", className)}
                >
                    <Clock className="w-3 h-3" />
                    {formatTime(executionTimeout)}
                </Badge>

                <Badge
                    variant="outline"
                    className={cn("text-xs text-black dark:text-white border-purple-500 flex items-center gap-1", className)}
                >
                    <HardDrive className="w-3 h-3" />
                    {formatMemory(memoryLimit)}
                </Badge>
            </div>
        </div>
    );
}
