"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiAddEventParticipant, apiRegisterForEvent } from "@/lib/api";
import { NextJudgeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";
import { CheckIcon, ClockIcon, UsersIcon } from "lucide-react";
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

    // check if user is already registered
    const userIsParticipant = contest.participants?.some(
        p => p.id === session?.nextjudge_id
    ) || isRegistered;

    const getStatusColor = (status: ContestStatus) => {
        switch (status) {
            case "upcoming":
                return "from-blue-500 to-blue-800";
            case "ongoing":
                return "from-green-500 to-green-700";
            case "ended":
                return "from-gray-400 to-gray-500";
        }
    };

    const getTimeDisplay = () => {
        switch (status) {
            case "upcoming":
                return `Contest will start in ${formatDistanceToNow(startTime)}`;
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
            return `${hours}H ${minutes}M`;
        } else {
            return `${minutes}M`;
        }
    };

    const handleNavigateToContest = () => {
        router.push(`/platform/contests/${contest.id}`);
    };

    const handleRegister = async () => {
        if (!session?.nextjudge_token || !session?.nextjudge_id) {
            toast.error("You must be logged in to register");
            return;
        }

        // if user is already registered and contest is ongoing/ended, navigate to contest
        if (userIsParticipant && (status === "ongoing" || status === "ended")) {
            handleNavigateToContest();
            return;
        }

        // if user is already registered for upcoming contest, do nothing
        if (userIsParticipant) {
            return;
        }

        setIsRegistering(true);
        try {
            // use admin endpoint for admins, user endpoint for regular users
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
            return status === "upcoming" ? "Registered" : "Enter";
        }
        return status === "upcoming" ? "Register" : status === "ongoing" ? "Enter" : "Enter";
    };

    const getButtonIcon = () => {
        if (userIsParticipant && status === "upcoming") {
            return <CheckIcon className="h-3 w-3" />;
        }
        return null;
    };

    return (
        <Card className="overflow-hidden">
            <div className={cn("bg-gradient-to-br text-white p-4 sm:p-6 relative min-h-[120px]", getStatusColor(status))}>
                <div className="absolute inset-0 opacity-10">
                    <div className="text-xs font-mono leading-3 break-all">
                        00010110100101101100100101101100010110100101101100
                        10010101011001011011001001011011000101101001011011
                        00100101010110010110110010010110110001011010010110
                    </div>
                </div>
                <div className="relative z-10">
                    <h3
                        className="text-lg font-semibold mb-2 pr-20 cursor-pointer hover:text-white/80 transition-colors"
                        onClick={handleNavigateToContest}
                    >
                        {contest.title}
                    </h3>
                    <div className="space-y-2 text-sm">
                        <p className="text-white/90">{getTimeDisplay()}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                <span>Duration: {getDuration()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <UsersIcon className="h-3 w-3" />
                                <span>{contest.participants?.length || 0} Registrations</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{format(startTime, "d MMM yyyy, HH:mm")}</span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={userIsParticipant ? "secondary" : "default"}
                            size="sm"
                            onClick={handleRegister}
                            disabled={isRegistering || (userIsParticipant && status === "upcoming")}
                            className={cn(
                                "min-w-[100px]",
                                userIsParticipant && status === "upcoming" &&
                                "bg-green-100 hover:bg-green-100 text-green-800 border-green-200"
                            )}
                        >
                            {getButtonIcon()}
                            <span className={cn(getButtonIcon() && "ml-1")}>
                                {isRegistering ? "..." : getButtonText()}
                            </span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function ContestLandingPage({ upcomingContests, ongoingContests, pastContests }: ContestLandingPageProps) {
    const [activeTab, setActiveTab] = useState<"upcoming" | "ongoing" | "past">(
        ongoingContests.length > 0 ? "ongoing" : "upcoming"
    );
    const [contests, setContests] = useState({
        upcoming: upcomingContests,
        ongoing: ongoingContests,
        past: pastContests
    });

    const currentContests = activeTab === "upcoming" ? contests.upcoming :
        activeTab === "ongoing" ? contests.ongoing :
            contests.past;

    const handleParticipantAdded = (eventId: number) => {
        // we could refetch the contests here or update the local state
        // for now, we'll just show the UI feedback
        console.log(`Participant added to event ${eventId}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-6 min-w-[800px]">
                {/* header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Contests</h1>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                            <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* tabs */}
                <div className="border-b border-border mb-6">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab("upcoming")}
                            className={cn(
                                "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                                activeTab === "upcoming"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <span>Upcoming contests</span>
                                {contests.upcoming.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {contests.upcoming.length}
                                    </Badge>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("ongoing")}
                            className={cn(
                                "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                                activeTab === "ongoing"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <span>Live contests</span>
                                <div className="flex items-center gap-1">
                                    {contests.ongoing.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                            {contests.ongoing.length}
                                        </Badge>
                                    )}
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("past")}
                            className={cn(
                                "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                                activeTab === "past"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <span>Past contests</span>
                                {contests.past.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {contests.past.length}
                                    </Badge>
                                )}
                            </div>
                        </button>

                    </div>
                </div>

                {/* contest grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {currentContests.length > 0 ? (
                        currentContests.map((contest) => (
                            <ContestCard
                                key={contest.id}
                                contest={contest}
                                onParticipantAdded={handleParticipantAdded}
                            />
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-12 text-muted-foreground">
                            No {activeTab} contests available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
