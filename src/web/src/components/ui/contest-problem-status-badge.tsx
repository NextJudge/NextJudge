import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, Bug, Check, Clock, Code, Eye, Loader, MemoryStick, Timer, X } from 'lucide-react';

export type ContestProblemStatus =
    | 'ACCEPTED'
    | 'WRONG_ANSWER'
    | 'TIME_LIMIT_EXCEEDED'
    | 'MEMORY_LIMIT_EXCEEDED'
    | 'RUNTIME_ERROR'
    | 'COMPILE_TIME_ERROR'
    | 'PENDING'
    | 'NOT_ATTEMPTED'
    | 'NOT_AVAILABLE'
    | 'ADMIN_PREVIEW';

interface ContestProblemStatusBadgeProps {
    status: ContestProblemStatus;
    className?: string;
}

export function ContestProblemStatusBadge({ status, className }: ContestProblemStatusBadgeProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'ACCEPTED':
                return {
                    text: 'ACCEPTED',
                    className: 'text-white border-green-600 bg-transparent',
                    icon: <Check className="w-3 h-3" />
                };
            case 'WRONG_ANSWER':
                return {
                    text: 'WRONG ANSWER',
                    className: 'text-white border-red-500 bg-transparent whitespace-nowrap',
                    icon: <X className="w-3 h-3" />
                };
            case 'TIME_LIMIT_EXCEEDED':
                return {
                    text: 'TIME LIMIT',
                    className: 'text-white border-yellow-500 bg-transparent whitespace-nowrap',
                    icon: <Timer className="w-3 h-3" />
                };
            case 'MEMORY_LIMIT_EXCEEDED':
                return {
                    text: 'MEMORY LIMIT',
                    className: 'text-white border-purple-500 bg-transparent whitespace-nowrap',
                    icon: <MemoryStick className="w-3 h-3" />
                };
            case 'RUNTIME_ERROR':
                return {
                    text: 'RUNTIME ERROR',
                    className: 'text-white border-pink-500 bg-transparent whitespace-nowrap',
                    icon: <Bug className="w-3 h-3" />
                };
            case 'COMPILE_TIME_ERROR':
                return {
                    text: 'COMPILE ERROR',
                    className: 'text-white border-orange-600 bg-transparent whitespace-nowrap',
                    icon: <Code className="w-3 h-3" />
                };
            case 'PENDING':
                return {
                    text: 'PENDING',
                    className: 'text-white border-blue-400 bg-transparent whitespace-nowrap',
                    icon: <Loader className="w-3 h-3 animate-spin" />
                };
            case 'NOT_ATTEMPTED':
                return {
                    text: 'NOT ATTEMPTED',
                    className: 'text-white border-gray-500 bg-transparent whitespace-nowrap',
                    icon: <Clock className="w-3 h-3" />
                };
            case 'NOT_AVAILABLE':
                return {
                    text: 'NOT AVAILABLE',
                    className: 'text-white border-gray-600 bg-transparent whitespace-nowrap',
                    icon: <AlertTriangle className="w-3 h-3" />
                };
            case 'ADMIN_PREVIEW':
                return {
                    text: 'ADMIN PREVIEW',
                    className: 'text-white border-blue-600 bg-transparent whitespace-nowrap',
                    icon: <Eye className="w-3 h-3" />
                };
            default:
                return {
                    text: 'UNKNOWN',
                    className: 'text-white border-gray-600 bg-transparent',
                    icon: null
                };
        }
    };

    const config = getStatusConfig();

    return (
        <Badge
            variant="outline"
            className={cn(
                "text-xs font-medium flex items-center gap-1 w-fit",
                config.className,
                className
            )}
        >
            {config.icon}
            {config.text}
        </Badge>
    );
}
