"use client";

import { apiGetEventProblems } from "@/lib/api";
import { NextJudgeEvent } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

export interface EventMetadata {
    problemCount: number;
    participantCount: number;
    loading: boolean;
    error: string | null;
}

export function useEventMetadata(contest: NextJudgeEvent): EventMetadata {
    const { data: session } = useSession();
    const [metadata, setMetadata] = useState<EventMetadata>({
        problemCount: contest.problem_count || contest.problems?.length || 0,
        participantCount: contest.participant_count || contest.participants?.length || 0,
        loading: false,
        error: null,
    });

    const fetchMetadata = useCallback(async () => {
        if (!session?.nextjudge_token || !contest.id) return;

        setMetadata(prev => ({ ...prev, loading: true, error: null }));

        try {
            // try to fetch additional metadata if not already provided
            let problemCount = metadata.problemCount;
            let participantCount = metadata.participantCount;

            // only fetch if we don't already have the data
            if (!contest.problems && !contest.problem_count) {
                try {
                    const problems = await apiGetEventProblems(session.nextjudge_token, contest.id);
                    problemCount = problems.length;
                } catch (error) {
                    console.warn('Could not fetch event problems:', error);
                    // this might fail if not implemented, so we gracefully fall back
                }
            }

            // participant count would require additional API call that might not be implemented
            // for now we use what's provided in the contest object

            setMetadata({
                problemCount,
                participantCount,
                loading: false,
                error: null,
            });
        } catch (error) {
            console.error('Failed to fetch event metadata:', error);
            setMetadata(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch metadata',
            }));
        }
    }, [session?.nextjudge_token, contest.id, contest.problems, contest.problem_count, metadata.problemCount, metadata.participantCount]);

    useEffect(() => {
        // only fetch if we don't have complete data
        if ((!contest.problems && !contest.problem_count) ||
            (!contest.participants && !contest.participant_count)) {
            fetchMetadata();
        }
    }, [fetchMetadata, contest.problems, contest.problem_count, contest.participants, contest.participant_count]);

    return metadata;
}
