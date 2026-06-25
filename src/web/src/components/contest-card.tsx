"use client";

import { EndContestButton } from "@/components/contests/end-contest-button";
import { TeamRegistrationDialog } from "@/components/contests/team-registration-dialog";
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
import { useEventMetadata } from "@/hooks/queries/use-event-metadata";
import { useMyEventTeam } from "@/hooks/queries/use-event-teams";
import {
    useAddEventParticipant,
    useRegisterForEvent,
} from "@/hooks/queries/use-event-queries";
import { getContestStatus, ContestStatus } from "@/lib/contest-utils";
import { NextJudgeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { CheckIcon, ClockIcon, Edit, FileCode, MoreVertical, Trash2, UsersIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type { ContestStatus };

interface ContestCardProps {
    className?: string;
    contest: NextJudgeEvent;
    onParticipantAdded?: (eventId: number) => void;
    showActions?: boolean;
    deleteContest?: (id: number) => void;
    editContest?: (contest: NextJudgeEvent) => void;
    onAddParticipant?: () => void;
    onContestEnded?: () => void;
    variant?: "default" | "compact";
}

export function ContestCard({
    className,
    contest,
    onParticipantAdded,
    showActions = false,
    deleteContest,
    editContest,
    onAddParticipant,
    onContestEnded,
    variant = "default",
}: ContestCardProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isRegistered, setIsRegistered] = useState(false);
    const [teamDialogOpen, setTeamDialogOpen] = useState(false);

    const registerMutation = useRegisterForEvent(session?.nextjudge_token);
    const addParticipantMutation = useAddEventParticipant(session?.nextjudge_token);
    const { problemCount, participantCount } = useEventMetadata(contest);
    const status = getContestStatus(contest.start_time, contest.end_time);

    const userIsParticipant = contest.participants?.some(
        p => p.id === session?.nextjudge_id
    ) || isRegistered;

    const { data: myTeam } = useMyEventTeam(
        session?.nextjudge_token,
        contest.id,
        Boolean(contest.teams && userIsParticipant),
    );

    const needsTeam = contest.teams && userIsParticipant && !myTeam && status !== "ended";

    const isCreatorOrAdmin = session?.user?.is_admin || session?.nextjudge_id === contest.user_id;

    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);

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
        const duration = endTime.getTime() - startTime.getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const handleNavigateToContest = () => {
        router.push(`/platform/contests/${contest.id}`);
    };

    const handleRegister = async () => {
        if (status === "ended") {
            handleNavigateToContest();
            return;
        }

        if (!session?.nextjudge_token || !session?.nextjudge_id) {
            toast.error("You must be logged in to register");
            return;
        }

        if (userIsParticipant && status === "ongoing") {
            if (needsTeam) {
                setTeamDialogOpen(true);
                return;
            }
            handleNavigateToContest();
            return;
        }

        if (userIsParticipant) {
            if (needsTeam) {
                setTeamDialogOpen(true);
            }
            return;
        }

        try {
            if (session.user?.is_admin) {
                await addParticipantMutation.mutateAsync({
                    eventId: contest.id,
                    userId: session.nextjudge_id.toString(),
                });
            } else {
                await registerMutation.mutateAsync(contest.id);
            }
            setIsRegistered(true);
            toast.success("Successfully registered for the contest!");
            onParticipantAdded?.(contest.id);
            if (contest.teams) {
                setTeamDialogOpen(true);
            }
        } catch (error) {
            console.error('Failed to register:', error);
            const errorMessage = error instanceof Error ? error.message : "Failed to register";

            if (errorMessage.includes("409") || errorMessage.includes("already a participant")) {
                setIsRegistered(true);
                toast.info("You are already registered for this contest");
            } else {
                toast.error(errorMessage);
            }
        }
    };

    const getButtonText = () => {
        if (needsTeam) {
            return "Join Team";
        }
        if (userIsParticipant) {
            return status === "upcoming" ? "Registered" : "Enter Contest";
        }
        if (contest.teams && status !== "ended") {
            return status === "upcoming" ? "Register for Teams" : "Register & Join Team";
        }
        return status === "upcoming" ? "Register Now" : status === "ongoing" ? "Enter Contest" : "View Results";
    };

    const getButtonIcon = () => {
        if (userIsParticipant && status === "upcoming") {
            return <CheckIcon className="h-4 w-4" />;
        }
        return null;
    };

    const handleCardClick = (e: React.MouseEvent) => {
        if (showActions && isCreatorOrAdmin) {
            if (e.target instanceof Element &&
                (e.target.closest('[role="menu"]') ||
                    e.target.closest('button') ||
                    e.target.closest('[data-radix-popper-content-wrapper]'))) {
                return;
            }
            if (editContest) {
                editContest(contest);
            }
        } else if (!showActions) {
            handleNavigateToContest();
        }
    };

    if (variant === "compact") {
        return (
            <Card
                className={cn(
                    "relative overflow-hidden cursor-pointer hover:border-primary/50 transition-all group",
                    className
                )}
                onClick={handleCardClick}
            >
                {status === "ended" && (
                    <div
                        className="absolute top-0 right-0 w-40 h-10 text-primary-foreground font-bold text-sm flex items-center justify-center rotate-45 translate-x-10 translate-y-5 z-10 shadow-lg opacity-75"
                        style={{
                            background: `repeating-linear-gradient(45deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 10px, hsl(var(--muted)) 10px, hsl(var(--muted)) 20px)`
                        }}
                    >
                        <span className="whitespace-nowrap bg-primary px-2 py-0.5 border border-primary/20">ENDED</span>
                    </div>
                )}
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle
                                className="text-lg font-bold mb-1 cursor-pointer line-clamp-2 group-hover:text-primary transition-colors"
                                onClick={handleNavigateToContest}
                            >
                                {contest.title}
                            </CardTitle>
                            <CardDescription className="text-sm line-clamp-1">
                                {contest.description}
                            </CardDescription>
                        </div>
                        {status !== "ended" && (
                            <Badge
                                variant="secondary"
                                className="text-xs font-semibold px-2 py-0.5 flex-shrink-0"
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-2 pt-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{getTimeDisplay()}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                            <ClockIcon className="h-3 w-3" />
                            <span className="font-medium">{getDuration()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                            <FileCode className="h-3 w-3" />
                            <span className="font-medium">{problemCount} {problemCount === 1 ? "Problem" : "Problems"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                            <UsersIcon className="h-3 w-3" />
                            <span className="font-medium">{participantCount} {participantCount === 1 ? "Participant" : "Participants"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={cn(
                "relative overflow-hidden",
                (!showActions || (showActions && isCreatorOrAdmin)) && "cursor-pointer hover:bg-accent/20 transition-all",
                className
            )}
            onClick={handleCardClick}
        >
            {status === "ended" && (
                <div
                    className="absolute top-0 right-0 w-40 h-10 text-primary-foreground font-bold text-sm flex items-center justify-center rotate-45 translate-x-10 translate-y-5 z-10 shadow-lg opacity-75"
                    style={{
                        background: `repeating-linear-gradient(45deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 10px, hsl(var(--muted)) 10px, hsl(var(--muted)) 20px)`
                    }}
                >
                    <span className="whitespace-nowrap bg-primary px-2 py-0.5 border border-primary/20">ENDED</span>
                </div>
            )}
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle
                            className="text-2xl font-bold mb-2 cursor-pointer line-clamp-2"
                            onClick={handleNavigateToContest}
                        >
                            {contest.title}
                        </CardTitle>
                        <CardDescription className="text-sm line-clamp-2">
                            {contest.description}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {status !== "ended" && (
                            <Badge
                                variant="secondary"
                                className="text-xs font-semibold px-3 py-1"
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                        )}
                        {showActions && isCreatorOrAdmin && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {editContest && (
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            editContest(contest);
                                        }}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {onAddParticipant && (
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            onAddParticipant();
                                        }}>
                                            <UsersIcon className="mr-2 h-4 w-4" />
                                            Add participant(s)
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        className="p-0"
                                        asChild
                                    >
                                        <EndContestButton
                                            contest={contest}
                                            onEnded={onContestEnded}
                                            variant="ghost"
                                            size="sm"
                                            showLabel
                                            className="w-full justify-start px-2 py-1.5 h-auto font-normal"
                                        />
                                    </DropdownMenuItem>
                                    {deleteContest && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteContest(contest.id);
                                                }}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{getTimeDisplay()}</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                        <ClockIcon className="h-3.5 w-3.5" />
                        <span className="font-medium">{getDuration()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                        <FileCode className="h-3.5 w-3.5" />
                        <span className="font-medium">{problemCount} {problemCount === 1 ? "Problem" : "Problems"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                        <UsersIcon className="h-3.5 w-3.5" />
                        <span className="font-medium">{participantCount} {participantCount === 1 ? "Participant" : "Participants"}</span>
                    </div>
                </div>

                {!showActions && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-foreground">
                                {format(startTime, "MMM d, yyyy")} - {format(endTime, "MMM d, yyyy")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                            </span>
                        </div>
                        <Button
                            variant={userIsParticipant && status === "upcoming" ? "secondary" : "default"}
                            size="default"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRegister();
                            }}
                            disabled={registerMutation.isPending || (userIsParticipant && status === "upcoming" && !needsTeam)}
                            className="min-w-[140px] font-semibold transition-all"
                        >
                            {getButtonIcon()}
                            <span className={cn(getButtonIcon() && "ml-2")}>
                                {registerMutation.isPending ? "Processing..." : getButtonText()}
                            </span>
                        </Button>
                    </div>
                )}

                <TeamRegistrationDialog
                    open={teamDialogOpen}
                    onOpenChange={setTeamDialogOpen}
                    eventId={contest.id}
                    eventTitle={contest.title}
                />

                {showActions && (
                    <div className="flex flex-col gap-1 pt-4 border-t">
                        <span className="text-sm font-medium text-foreground">
                            {format(startTime, "MMM d, yyyy")} - {format(endTime, "MMM d, yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
