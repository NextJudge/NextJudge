"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContestCard } from "@/components/contest-card";
import { NextJudgeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

interface ContestLandingPageProps {
    upcomingContests: NextJudgeEvent[];
    ongoingContests: NextJudgeEvent[];
    pastContests: NextJudgeEvent[];
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
