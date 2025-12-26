"use client";

import { apiGetEventAttempts } from "@/lib/api";
import type { Problem, User } from "@/lib/types";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ContestPodiumProps {
    problems: Problem[];
    participants: User[];
    contestId: number;
    contestStatus: 'upcoming' | 'ongoing' | 'ended';
    isAdmin?: boolean;
}

interface ParticipantData {
    user: User;
    totalAccepted: number;
    penaltyTimeMinutes: number;
    totalSubmissions: number;
}

export function ContestPodium({
    problems,
    participants,
    contestId,
    contestStatus,
    isAdmin = false
}: ContestPodiumProps) {
    const { data: session } = useSession();
    const [topThree, setTopThree] = useState<ParticipantData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPodiumData = async () => {
            if (participants.length === 0) {
                setTopThree([]);
                return;
            }

            if ((contestStatus === 'upcoming' && !isAdmin) || !session?.nextjudge_token) {
                setTopThree([]);
                return;
            }

            setLoading(true);
            try {
                const attempts = await apiGetEventAttempts(session.nextjudge_token, contestId);

                const participantMap = new Map<string, ParticipantData>();

                participants.forEach((participant) => {
                    participantMap.set(participant.id, {
                        user: participant,
                        totalAccepted: 0,
                        totalSubmissions: 0,
                        penaltyTimeMinutes: 0,
                    });
                });

                attempts.forEach((a) => {
                    const pd = participantMap.get(a.user_id);
                    if (!pd) return;

                    if (a.first_accepted_time) {
                        pd.totalAccepted += 1;
                        const wrongBeforeAC = (a.attempts || 1) - 1;
                        const minutesToSolve = a.minutes_to_solve ?? 0;
                        pd.penaltyTimeMinutes += minutesToSolve + 20 * Math.max(0, wrongBeforeAC);
                    }

                    pd.totalSubmissions += a.total_attempts;
                });

                const sorted = Array.from(participantMap.values()).sort((a, b) => {
                    if (a.totalAccepted !== b.totalAccepted) return b.totalAccepted - a.totalAccepted;
                    if (a.penaltyTimeMinutes !== b.penaltyTimeMinutes) return a.penaltyTimeMinutes - b.penaltyTimeMinutes;
                    return a.totalSubmissions - b.totalSubmissions;
                });

                setTopThree(sorted.slice(0, 3));
            } catch (error) {
                console.error('Failed to fetch podium data:', error);
                setTopThree([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPodiumData();
    }, [session?.nextjudge_token, contestId, contestStatus, participants, problems, isAdmin]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (topThree.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <span>No standings yet</span>
            </div>
        );
    }

    const getAvatarUrl = (user: User) => {
        if (user.image && user.image.trim() !== '') {
            return user.image;
        }
        return `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user.email ?? user.id}`;
    };

    const maxAccepted = Math.max(...topThree.map(p => p.totalAccepted), 1);
    const getBarHeight = (position: number, accepted: number) => {
        if (maxAccepted === 0) {
            return position === 1 ? 70 : position === 2 ? 55 : 40;
        }
        const baseHeight = position === 1 ? 70 : position === 2 ? 55 : 40;
        const scoreMultiplier = accepted / Math.max(maxAccepted, 1);
        return baseHeight * Math.max(scoreMultiplier, 0.5);
    };

    const podiumData = [
        topThree[1] ? { ...topThree[1], position: 2, height: getBarHeight(2, topThree[1].totalAccepted) } : null,
        topThree[0] ? { ...topThree[0], position: 1, height: getBarHeight(1, topThree[0].totalAccepted) } : null,
        topThree[2] ? { ...topThree[2], position: 3, height: getBarHeight(3, topThree[2].totalAccepted) } : null,
    ].filter(Boolean) as Array<ParticipantData & { position: number; height: number }>;

    return (
        <div className="h-[200px] flex items-end justify-center gap-3 px-4">
            {podiumData.map((participant) => (
                <div
                    key={participant.user.id}
                    className="flex flex-col items-center flex-1 max-w-[110px] h-full"
                >
                    <div className="flex-1 flex flex-col items-center justify-end mb-2">
                        <div className="relative w-10 h-10 mb-1.5 flex-shrink-0">
                            <Image
                                src={getAvatarUrl(participant.user)}
                                alt={participant.user.name}
                                className="rounded-full border-2 border-osu object-cover"
                                width={40}
                                height={40}
                            />
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-osu flex items-center justify-center text-white text-[10px] font-bold border-2 border-background">
                                {participant.position}
                            </div>
                        </div>
                        <span className="text-[11px] font-medium text-foreground truncate w-full text-center px-1">
                            {participant.user.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {participant.totalSubmissions}/{participant.totalAccepted}
                        </span>
                    </div>
                    <div
                        className="w-full bg-osu rounded-t-md flex items-end justify-center transition-all duration-300 shadow-sm relative"
                        style={{
                            height: `${participant.height}%`,
                            minHeight: '35px',
                            marginBottom: '-25px',
                        }}
                    >
                        <div className="text-white text-xs font-bold mb-1.5">
                            {participant.position === 1 ? <h2 className="text-2xl">1</h2> : participant.position === 2 ? <h2 className="text-2xl">2</h2> : <h2 className="text-2xl">3</h2>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
