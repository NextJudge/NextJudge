"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@/components/ui/pagination";
import { ContestCard } from "@/components/contest-card";
import { apiAddEventParticipant, apiGetEventParticipants, apiGetUsers } from "@/lib/api";
import { NextJudgeEvent, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useSession } from "next-auth/react";
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

export function EnhancedContestCard({
    className,
    contest,
    deleteContest,
    editContest,
    onParticipantAdded,
    showActions = true,
}: EnhancedContestCardProps) {
    const { data: session } = useSession();
    const [showParticipantDialog, setShowParticipantDialog] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [participants, setParticipants] = useState<User[]>(contest.participants || []);

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

    const handleAddParticipantClick = () => {
        setShowParticipantDialog(true);
    };

    return (
        <>
            <ContestCard
                className={className}
                contest={contest}
                showActions={showActions}
                deleteContest={deleteContest}
                editContest={editContest}
                onAddParticipant={handleAddParticipantClick}
                onParticipantAdded={onParticipantAdded}
            />
            <Dialog open={showParticipantDialog} onOpenChange={setShowParticipantDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Participants</DialogTitle>
                        <DialogDescription>
                            Select users to add as participants to "{contest.title}"
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
        </>
    );
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
            <div className="min-h-[1000px]">
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
