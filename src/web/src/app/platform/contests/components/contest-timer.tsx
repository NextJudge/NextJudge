"use client";

import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status-badge";
import { useEffect, useState } from "react";

interface ContestTimerProps {
    startTime: string;
    endTime: string;
    status: 'upcoming' | 'ongoing' | 'ended';
}

export function ContestTimer({ startTime, endTime, status }: ContestTimerProps) {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const start = new Date(startTime);
            const end = new Date(endTime);

            let targetTime: Date;
            let prefix: string;

            if (status === 'upcoming') {
                targetTime = start;
                prefix = "Starts in ";
            } else if (status === 'ongoing') {
                targetTime = end;
                prefix = "Ends in ";
            } else {
                setTimeLeft("Contest ended");
                return;
            }

            const timeDiff = targetTime.getTime() - now.getTime();

            if (timeDiff <= 0) {
                if (status === 'upcoming') {
                    setTimeLeft("Contest starting...");
                } else {
                    setTimeLeft("Contest ended");
                }
                return;
            }

            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

            const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            setTimeLeft(prefix + formattedTime);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [startTime, endTime, status]);

    const getStatusBadgeStatus = (): 'online' | 'offline' | 'maintenance' | 'degraded' => {
        switch (status) {
            case 'upcoming':
                return 'maintenance';  // blue for upcoming
            case 'ongoing':
                return 'online';       // green for live/ongoing
            case 'ended':
                return 'offline';      // red for ended
            default:
                return 'degraded';     // amber for unknown
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'upcoming':
                return 'Upcoming';
            case 'ongoing':
                return 'Live';
            case 'ended':
                return 'Ended';
            default:
                return 'Unknown';
        }
    };

    return (
        <div className="text-right space-y-2">
            <div className="text-sm text-muted-foreground">Time remaining</div>
            <div className="text-2xl font-mono font-bold">
                {timeLeft}
            </div>
            <Status
                status={getStatusBadgeStatus()}
                className="text-xs font-medium"
            >
                <StatusIndicator />
                <StatusLabel>{getStatusText()}</StatusLabel>
            </Status>
        </div>
    );
}
