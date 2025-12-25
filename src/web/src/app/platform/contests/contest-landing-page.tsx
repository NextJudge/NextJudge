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
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiAddEventParticipant, apiRegisterForEvent } from "@/lib/api";
import { NextJudgeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, FileCode, UsersIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ContestLandingPageProps {
    upcomingContests: NextJudgeEvent[];
    ongoingContests: NextJudgeEvent[];
    pastContests: NextJudgeEvent[];
}

type ContestStatus = "upcoming" | "ongoing" | "ended";

function ContestCard({ contest, onParticipantAdded }: {
    contest: NextJudgeEvent;
    onParticipantAdded?: (eventId: number) => void;
}) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);
    const now = new Date();

    const status: ContestStatus = isBefore(now, startTime)
        ? "upcoming"
        : isAfter(now, endTime)
            ? "ended"
            : "ongoing";

    const userIsParticipant = contest.participants?.some(
        p => p.id === session?.nextjudge_id
    ) || isRegistered;


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
            handleNavigateToContest();
            return;
        }

        if (userIsParticipant) {
            return;
        }

        setIsRegistering(true);
        try {
            if (session.user?.is_admin) {
                await apiAddEventParticipant(
                    session.nextjudge_token,
                    contest.id,
                    session.nextjudge_id.toString()
                );
            } else {
                await apiRegisterForEvent(
                    session.nextjudge_token,
                    contest.id
                );
            }
            setIsRegistered(true);
            toast.success("Successfully registered for the contest!");
            onParticipantAdded?.(contest.id);
        } catch (error) {
            console.error('Failed to register:', error);
            const errorMessage = error instanceof Error ? error.message : "Failed to register";

            if (errorMessage.includes("409") || errorMessage.includes("already a participant")) {
                setIsRegistered(true);
                toast.info("You are already registered for this contest");
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsRegistering(false);
        }
    };

    const getButtonText = () => {
        if (userIsParticipant) {
            return status === "upcoming" ? "Registered" : "Enter Contest";
        }
        return status === "upcoming" ? "Register Now" : status === "ongoing" ? "Enter Contest" : "View Results";
    };

    const getButtonIcon = () => {
        if (userIsParticipant && status === "upcoming") {
            return <CheckIcon className="h-4 w-4" />;
        }
        return null;
    };

    const problemCount = contest.problem_count ?? contest.problems?.length ?? 0;
    const participantCount = contest.participant_count ?? contest.participants?.length ?? 0;

    return (
        <Card className="relative overflow-hidden">
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
                    {status !== "ended" && (
                        <Badge
                            variant="secondary"
                            className="text-xs font-semibold px-3 py-1 flex-shrink-0"
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                    )}
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
                        onClick={handleRegister}
                        disabled={isRegistering || (userIsParticipant && status === "upcoming")}
                        className="min-w-[140px] font-semibold transition-all"
                    >
                        {getButtonIcon()}
                        <span className={cn(getButtonIcon() && "ml-2")}>
                            {isRegistering ? "Processing..." : getButtonText()}
                        </span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

const ITEMS_PER_PAGE = 6;

function ContestTabContent({
    contests,
    onParticipantAdded,
    emptyTitle,
    emptyDescription
}: {
    contests: NextJudgeEvent[];
    onParticipantAdded?: (eventId: number) => void;
    emptyTitle?: string;
    emptyDescription?: string;
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(contests.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedContests = contests.slice(startIndex, endIndex);

    if (contests.length === 0) {
        return (
            <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
                <div className="text-muted-foreground text-lg mb-2">{emptyTitle || "No contests"}</div>
                <div className="text-sm text-muted-foreground/80">{emptyDescription || "Check back later for new contests"}</div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-[1000px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {paginatedContests.map((contest) => (
                        <ContestCard
                            key={contest.id}
                            contest={contest}
                            onParticipantAdded={onParticipantAdded}
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

export function ContestLandingPage({ upcomingContests, ongoingContests, pastContests }: ContestLandingPageProps) {
    const defaultTab = ongoingContests.length > 0 ? "ongoing" : upcomingContests.length > 0 ? "upcoming" : "past";

    const handleParticipantAdded = (eventId: number) => {
        console.log(`Participant added to event ${eventId}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Contests</h1>
                    <p className="text-muted-foreground">Compete, learn, and showcase your skills</p>
                </div>

                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 h-auto p-1 bg-muted/50">
                        <TabsTrigger
                            value="upcoming"
                            className="relative px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            <div className="flex items-center gap-2">
                                <span>Upcoming</span>
                                {upcomingContests.length > 0 && (
                                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                        {upcomingContests.length}
                                    </Badge>
                                )}
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="ongoing"
                            className="relative px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            <div className="flex items-center gap-2">
                                <span>Live</span>
                                <div className="flex items-center gap-1.5">
                                    {ongoingContests.length > 0 && (
                                        <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                            {ongoingContests.length}
                                        </Badge>
                                    )}
                                    {ongoingContests.length > 0 && (
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                    )}
                                </div>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="past"
                            className="relative px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            <div className="flex items-center gap-2">
                                <span>Past</span>
                                {pastContests.length > 0 && (
                                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                        {pastContests.length}
                                    </Badge>
                                )}
                            </div>
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative">
                        <TabsContent value="upcoming" className="mt-0">
                            <ContestTabContent
                                contests={upcomingContests}
                                onParticipantAdded={handleParticipantAdded}
                                emptyTitle="No upcoming contests"
                                emptyDescription="Check back later for new contests"
                            />
                        </TabsContent>

                        <TabsContent value="ongoing" className="mt-0">
                            <ContestTabContent
                                contests={ongoingContests}
                                onParticipantAdded={handleParticipantAdded}
                                emptyTitle="No live contests"
                                emptyDescription="There are no contests running at the moment"
                            />
                        </TabsContent>

                        <TabsContent value="past" className="mt-0">
                            <ContestTabContent
                                contests={pastContests}
                                onParticipantAdded={handleParticipantAdded}
                                emptyTitle="No past contests"
                                emptyDescription="Past contest results will appear here"
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
