"use client";

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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiAddEventParticipant, apiGetEventParticipants, apiGetUsers } from "@/lib/api";
import { NextJudgeEvent, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    CalendarIcon,
    ChevronDownIcon,
    CircleIcon,
    ClockIcon,
    PersonIcon,
    PlusIcon,
    TimerIcon,
} from "@radix-ui/react-icons";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { useEventMetadata } from "@/hooks/useEventMetadata";
import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";
import { Edit, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserSelector } from "./user-selector";

type EnhancedContestCardProps = {
    className?: string;
    contest: NextJudgeEvent;
    deleteContest?: (id: number) => void;
    editContest?: (contest: NextJudgeEvent) => void;
    onParticipantAdded?: (eventId: number) => void;
    showActions?: boolean;
};

type ContestStatus = "upcoming" | "ongoing" | "ended";

export function EnhancedContestCard({
    className,
    contest,
    deleteContest,
    editContest,
    onParticipantAdded,
    showActions = true,
}: EnhancedContestCardProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [showParticipantDialog, setShowParticipantDialog] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [participants, setParticipants] = useState<User[]>(contest.participants || []);

    const contestName = contest?.title;
    const contestDescription = contest?.description;
    const startTime = new Date(contest?.start_time);
    const endTime = new Date(contest?.end_time);
    const now = new Date();

    const status: ContestStatus = isBefore(now, startTime)
        ? "upcoming"
        : isAfter(now, endTime)
            ? "ended"
            : "ongoing";

    const { problemCount } = useEventMetadata(contest);
    // use local participants count if we have fetched participants, otherwise use contest prop
    const participantCount = participants.length;

    const isCreatorOrAdmin = session?.user?.is_admin || session?.nextjudge_id === contest.user_id;

    const getStatusColor = () => {
        return "";
    };

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

    const fetchUsers = useCallback(async () => {
        if (!session?.nextjudge_token) return;

        setLoadingUsers(true);
        try {
            const allUsers = await apiGetUsers(session.nextjudge_token);
            setUsers(allUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error("Failed to load users");
        } finally {
            setLoadingUsers(false);
        }
    }, [session?.nextjudge_token]);

    const fetchParticipants = useCallback(async () => {
        if (!session?.nextjudge_token) return;

        try {
            const eventParticipants = await apiGetEventParticipants(session.nextjudge_token, contest.id);
            setParticipants(eventParticipants);
        } catch (error) {
            console.error('Failed to fetch participants:', error);
            // gracefully fall back to existing participants if endpoint is not available
            if (error instanceof Error && !error.message.includes("404")) {
                toast.error("Failed to load participants");
            }
        }
    }, [session?.nextjudge_token, contest.id]);


    useEffect(() => {
        if (showParticipantDialog && users.length === 0) {
            fetchUsers();
        }
    }, [showParticipantDialog, users.length, fetchUsers]);

    useEffect(() => {
        if (showParticipantDialog) {
            fetchParticipants();
        }
    }, [showParticipantDialog, fetchParticipants]);

    // update participants when contest prop changes
    useEffect(() => {
        setParticipants(contest.participants || []);
    }, [contest.participants]);

    const handleAddParticipant = async (userId: string) => {
        if (!session?.nextjudge_token) return;

        try {
            await apiAddEventParticipant(session.nextjudge_token, contest.id, userId);
            toast.success("Participant added successfully");
            setShowParticipantDialog(false);
            onParticipantAdded?.(contest.id);
            // refresh participants list
            await fetchParticipants();
        } catch (error) {
            console.error('Failed to add participant:', error);
            const errorMessage = error instanceof Error ? error.message : "Failed to add participant";

            // handle specific error cases
            if (errorMessage.includes("409") || errorMessage.includes("already a participant")) {
                toast.error("User is already a participant in this contest");
            } else if (errorMessage.includes("404")) {
                if (errorMessage.includes("user not found")) {
                    toast.error("User not found");
                } else if (errorMessage.includes("event not found")) {
                    toast.error("Contest not found");
                } else {
                    toast.error("Participant management is not yet fully implemented in the backend");
                }
            } else if (errorMessage.includes("not implemented")) {
                toast.error("Participant management is not yet fully implemented in the backend");
            } else {
                toast.error(errorMessage);
            }
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // prevent card click when clicking on dropdown or other interactive elements
        if (e.target instanceof Element &&
            (e.target.closest('[role="menu"]') ||
                e.target.closest('button') ||
                e.target.closest('[data-radix-popper-content-wrapper]'))) {
            return;
        }

        if (showActions && isCreatorOrAdmin && editContest) {
            editContest(contest);
        } else if (!showActions) {
            // navigate to contest detail page when showActions is false
            router.push(`/platform/contests/${contest.id}`);
        }
    };

    const cardContent = (
        <Card
            className={cn(
                "transition-all duration-200 hover:shadow-lg",
                (isCreatorOrAdmin && showActions) || !showActions ? "cursor-pointer hover:bg-accent/20" : "",
                className
            )}
            onClick={handleCardClick}
        >
            <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-4 space-y-0">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{contestName}</CardTitle>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                        {contestDescription}
                    </CardDescription>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{format(startTime, "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            <span>{format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge
                        variant="secondary"
                        className="text-xs font-medium"
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>

                    {showActions && isCreatorOrAdmin && (
                        <div className="flex items-center rounded-md bg-secondary text-secondary-foreground">
                            <Separator orientation="vertical" className="h-[20px]" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" className="px-2 shadow-none">
                                        <ChevronDownIcon className="h-4 w-4 text-secondary-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    alignOffset={-5}
                                    className="w-[200px]"
                                    forceMount
                                >
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem onClick={() => editContest && editContest(contest)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => setShowParticipantDialog(true)}>
                                        <PlusIcon className="mr-2 h-4 w-4" />
                                        Add participant(s)
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        onClick={() => deleteContest && deleteContest(contest.id)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <CircleIcon className="h-3 w-3 fill-primary text-primary" />
                            <span className="font-medium">{problemCount}</span>
                            <span className="text-muted-foreground">
                                {problemCount === 1 ? "Problem" : "Problems"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <PersonIcon className="h-3 w-3" />
                            <span className="font-medium">{participantCount}</span>
                            <span className="text-muted-foreground">
                                {participantCount === 1 ? "Participant" : "Participants"}
                            </span>
                        </div>
                    </div>

                    {contest.teams && (
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="text-muted-foreground">Team Contest</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <TimerIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{getTimeDisplay()}</span>
                </div>


            </CardContent>

            <Dialog open={showParticipantDialog} onOpenChange={setShowParticipantDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Participants</DialogTitle>
                        <DialogDescription>
                            Select users to add as participants to "{contestName}"
                        </DialogDescription>
                    </DialogHeader>

                    <UserSelector
                        users={users}
                        loading={loadingUsers}
                        onUserSelect={handleAddParticipant}
                        existingParticipants={participants}
                    />
                </DialogContent>
            </Dialog>
        </Card>
    );

    if (isCreatorOrAdmin && showActions) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {cardContent}
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Click to edit this contest</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    if (!showActions) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {cardContent}
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Click to view contest details</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return cardContent;
}

const ITEMS_PER_PAGE = 6;

export function EnhancedContestGrid({
    contests,
    onDelete,
    onEdit,
    onParticipantAdded,
    showActions = true
}: {
    contests: NextJudgeEvent[];
    onDelete?: (id: number) => void;
    onEdit?: (contest: NextJudgeEvent) => void;
    onParticipantAdded?: (eventId: number) => void;
    showActions?: boolean;
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const safeContests = Array.isArray(contests) ? contests : [];
    const totalPages = Math.ceil(safeContests.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedContests = safeContests.slice(startIndex, endIndex);

    if (safeContests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground mb-2">No contests available</div>
                <div className="text-sm text-muted-foreground">
                    {showActions ? "Create your first contest to get started" : "Check back later for upcoming contests"}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-[1200px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {paginatedContests.map((contest: NextJudgeEvent) => (
                        <EnhancedContestCard
                            key={contest.id}
                            contest={contest}
                            deleteContest={onDelete}
                            editContest={onEdit}
                            onParticipantAdded={onParticipantAdded}
                            showActions={showActions}
                        />
                    ))}
                </div>
            </div>
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="default"
                                    onClick={() => {
                                        if (currentPage > 1) {
                                            setCurrentPage(currentPage - 1);
                                        }
                                    }}
                                    disabled={currentPage === 1}
                                    className="gap-1 pl-2.5"
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                    <span>Previous</span>
                                </Button>
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <Button
                                        variant={currentPage === page ? "outline" : "ghost"}
                                        size="icon"
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            currentPage === page && "bg-background"
                                        )}
                                    >
                                        {page}
                                    </Button>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="default"
                                    onClick={() => {
                                        if (currentPage < totalPages) {
                                            setCurrentPage(currentPage + 1);
                                        }
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="gap-1 pr-2.5"
                                >
                                    <span>Next</span>
                                    <ChevronRightIcon className="h-4 w-4" />
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </>
    );
}
