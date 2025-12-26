"use client";

import { useAnimate } from "framer-motion";
import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ContestTimerProps {
    startTime: string;
    endTime: string;
    status: 'upcoming' | 'ongoing' | 'ended';
}

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export function ContestTimer({ startTime, endTime, status }: ContestTimerProps) {
    const [targetTime, setTargetTime] = useState<string>("");
    const [prefix, setPrefix] = useState<string>("");

    useEffect(() => {
        if (status === 'upcoming') {
            setTargetTime(startTime);
            setPrefix("Starts in ");
        } else if (status === 'ongoing') {
            setTargetTime(endTime);
            setPrefix("Ends in ");
        } else {
            setTargetTime("");
            setPrefix("");
        }
    }, [status, startTime, endTime]);

    return (
        <div className="text-right space-y-2 px-8">
            {status === 'ended' ? (
                <div className="text-2xl font-mono font-bold flex items-center justify-end gap-2">
                    <Clock className="size-8 text-osu flex-shrink-0" />
                    <p>Ended</p>
                </div>
            ) : (
                <div className="flex items-center justify-end gap-4">
                    <Clock className="size-8 text-osu flex-shrink-0 mt-2" />
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-light mb-2">{prefix}</span>
                        <div className="flex items-center gap-1">
                            <CountdownItem unit="Hour" label="Hours" targetTime={targetTime} />
                            <span className="text-4xl font-light">:</span>
                            <CountdownItem unit="Minute" label="Minutes" targetTime={targetTime} />
                            <span className="text-4xl font-light">:</span>
                            <CountdownItem unit="Second" label="Seconds" targetTime={targetTime} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CountdownItem({ unit, label, targetTime }: { unit: string; label: string; targetTime: string }) {
    const { ref, time } = useTimer(unit, targetTime);
    const display = String(time).padStart(2, '0');

    return (
        <div className="flex flex-col items-center">
            <span
                ref={ref}
                className="block text-6xl font-mono font-bold min-w-fit"
            >
                {display}
            </span>
            <span className="text-xs font-light text-muted-foreground mt-1">{label}</span>
        </div>
    );
}

function useTimer(unit: string, targetTime: string) {
    const [ref, animate] = useAnimate();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeRef = useRef(0);
    const [time, setTime] = useState(0);

    useEffect(() => {
        handleCountdown();
        intervalRef.current = setInterval(handleCountdown, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [targetTime, unit]);

    const handleCountdown = async () => {
        const end = new Date(targetTime);
        const now = new Date();
        const distance = end.getTime() - now.getTime();

        let newTime = 0;
        switch (unit) {
            case "Hour":
                newTime = Math.max(0, Math.floor((distance % DAY) / HOUR));
                break;
            case "Minute":
                newTime = Math.max(0, Math.floor((distance % HOUR) / MINUTE));
                break;
            case "Second":
                newTime = Math.max(0, Math.floor((distance % MINUTE) / SECOND));
                break;
        }

        if (newTime !== timeRef.current) {
            if (ref.current) {
                await animate(
                    ref.current,
                    { scaleY: 0.2, translateY: -5, opacity: 0 },
                    { duration: 0.2, ease: "easeIn" }
                );
            }

            timeRef.current = newTime;
            setTime(newTime);

            if (ref.current) {
                await animate(
                    ref.current,
                    { scaleY: 1, translateY: 0, opacity: 1 },
                    { duration: 0.3, ease: "easeOut" }
                );
            }
        }
    };

    return { ref, time };
}
