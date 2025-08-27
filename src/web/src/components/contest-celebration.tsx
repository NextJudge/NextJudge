"use client";

import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

interface ContestCelebrationProps {
    contestId: number;
    isWinner: boolean;
    hasCompletedAllProblems: boolean;
    isFirstToComplete: boolean;
    contestStatus: "upcoming" | "ongoing" | "ended";
    className?: string;
}

export function ContestCelebration({
    contestId,
    isWinner,
    hasCompletedAllProblems,
    isFirstToComplete,
    contestStatus,
    className,
}: ContestCelebrationProps) {
    const [shouldShowCelebration, setShouldShowCelebration] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const celebrationShown = useRef(false);
    const { data: session } = useSession();

    useEffect(() => {
        const storageKey = `nextjudge-contest-celebration-${contestId}`;
        const hasShownBefore = localStorage.getItem(storageKey) === "true";

        // show celebration if:
        // 1. haven't shown before for this contest
        // 2. user is winner, completed all problems, or first to complete
        // 3. contest is ended or they completed/were first during ongoing
        const shouldCelebrate =
            !hasShownBefore &&
            (isWinner || hasCompletedAllProblems || isFirstToComplete) &&
            (contestStatus === "ended" ||
                (contestStatus === "ongoing" && (hasCompletedAllProblems || isFirstToComplete)));

        if (shouldCelebrate && !celebrationShown.current) {
            setShouldShowCelebration(true);
            setIsVisible(true);
            celebrationShown.current = true;
            localStorage.setItem(storageKey, "true");
            triggerCelebrationConfetti(isWinner);

            setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => setShouldShowCelebration(false), 500);
            }, 6000);
        }
    }, [contestId, isWinner, hasCompletedAllProblems, isFirstToComplete, contestStatus]);

    const createPyramidShape = () => {
        const pyramidSvg = `
      <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 16.88a1 1 0 0 1-.32-1.43L10.18 5.64a2 2 0 0 1 3.64 0l8 9.81a1 1 0 0 1-.32 1.43 1 1 0 0 1-1.4-.325L12 7.77l-8.1 8.775a1 1 0 0 1-1.4.325z"/>
      </svg>
    `;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 20;
        canvas.width = size;
        canvas.height = size;

        if (ctx) {
            ctx.fillStyle = '#ff6b35';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('▲', size / 2, size - 4);
        }

        return canvas;
    };

    const triggerCelebrationConfetti = (isWinnerCelebration: boolean = false) => {
        const colors = ["#ff6b35", "#ffffff", "#000000", "#ffa500", "#ff8c42"];
        confetti({
            particleCount: isWinnerCelebration ? 250 : 150,
            angle: 90,
            spread: 360,
            origin: { x: 0.5, y: 0.5 },
            colors,
            shapes: ["square", "circle", "star"],
            ticks: isWinnerCelebration ? 800 : 600,
            gravity: 0.5,
            scalar: isWinnerCelebration ? 1.5 : 1.2,
        });

        const sideBlasts = [
            { x: 0, angle: 45 },
            { x: 1, angle: 135 },
            { x: 0.2, angle: 60 },
            { x: 0.8, angle: 120 },
        ];

        sideBlasts.forEach((blast, index) => {
            setTimeout(() => {
                confetti({
                    particleCount: 80,
                    angle: blast.angle,
                    spread: 60,
                    origin: { x: blast.x, y: 0.6 },
                    colors,
                    shapes: ["square", "circle"],
                    ticks: 400,
                    scalar: 1.1,
                });
            }, index * 100);
        });

        setTimeout(() => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    confetti({
                        particleCount: 30,
                        angle: 90,
                        spread: 30,
                        origin: { x: 0.2 + (i * 0.15), y: 0.1 },
                        colors: ["#ff6b35"],
                        shapes: ["circle"],
                        ticks: 500,
                        gravity: 0.3,
                        scalar: 0.8,
                    });
                }, i * 150);
            }
        }, 300);

        const miniExplosions = () => {
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    confetti({
                        particleCount: 25,
                        angle: Math.random() * 360,
                        spread: 40,
                        origin: {
                            x: Math.random() * 0.6 + 0.2,
                            y: Math.random() * 0.4 + 0.3
                        },
                        colors,
                        shapes: ["square", "circle"],
                        ticks: 200,
                        scalar: 0.7,
                    });
                }, i * 80);
            }
        };

        setTimeout(miniExplosions, 600);
        setTimeout(miniExplosions, 1200);

        setTimeout(() => {
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    confetti({
                        particleCount: 50,
                        angle: 90,
                        spread: 45,
                        origin: { x: i * 0.1, y: 0 },
                        colors,
                        shapes: ["square", "circle", "star"],
                        ticks: 400,
                        gravity: 0.8,
                    });
                }, i * 50);
            }
        }, 1000);

        setTimeout(() => {
            for (let i = 0; i < 12; i++) {
                const angle = (i * 30) + 90;
                setTimeout(() => {
                    confetti({
                        particleCount: 20,
                        angle: angle,
                        spread: 30,
                        origin: { x: 0.5, y: 0.5 },
                        colors: ["#ff6b35", "#ffa500"],
                        shapes: ["circle"],
                        ticks: 300,
                        scalar: 0.9,
                    });
                }, i * 40);
            }
        }, 1400);

        setTimeout(() => {
            confetti({
                particleCount: isWinnerCelebration ? 300 : 200,
                angle: 90,
                spread: 180,
                origin: { x: 0.5, y: 0.8 },
                colors,
                shapes: ["square", "circle", "star"],
                ticks: isWinnerCelebration ? 1000 : 800,
                gravity: 0.4,
                scalar: isWinnerCelebration ? 2.0 : 1.5,
            });
        }, 1800);

        if (isWinnerCelebration) {
            setTimeout(() => {
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        confetti({
                            particleCount: 40,
                            angle: 90,
                            spread: 25,
                            origin: { x: 0.1 + (i * 0.05), y: 0 },
                            colors: ["#ffd700", "#ffed4e", "#ffa500", "#ff6b35"],
                            shapes: ["star", "circle"],
                            ticks: 600,
                            gravity: 0.3,
                            scalar: 1.8,
                        });
                    }, i * 80);
                }
            }, 2200);
        }
    };

    if (!shouldShowCelebration) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm",
                "transition-opacity duration-500",
                isVisible ? "opacity-100" : "opacity-0",
                className
            )}
        >
            <div
                className={cn(
                    "relative bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600",
                    "text-white p-8 rounded-3xl shadow-2xl border-4 border-white",
                    "transform transition-all duration-700 ease-out",
                    "flex flex-col items-center space-y-6 max-w-lg mx-4",
                    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-orange-300/20 before:to-orange-600/20 before:rounded-3xl before:animate-pulse",
                    isVisible ? "scale-100 rotate-0" : "scale-90 rotate-6"
                )}
            >
                <div className="absolute -top-4 -left-4 animate-bounce delay-100">
                    <Icons.logo className="w-8 h-8 text-orange-200 opacity-60" />
                </div>
                <div className="absolute -top-2 -right-6 animate-bounce delay-300">
                    <Icons.logo className="w-6 h-6 text-orange-100 opacity-50" />
                </div>
                <div className="absolute -bottom-4 -right-4 animate-bounce delay-500">
                    <Icons.logo className="w-7 h-7 text-orange-200 opacity-60" />
                </div>
                <div className="absolute -bottom-2 -left-6 animate-bounce delay-700">
                    <Icons.logo className="w-5 h-5 text-orange-100 opacity-50" />
                </div>
                <div className="relative z-10">
                    <div className="relative">
                        <Icons.logo className="w-20 h-20 text-white animate-bounce" />
                        <div className="absolute -inset-3 bg-white/30 rounded-full animate-ping" />
                        <div className="absolute -inset-6 bg-white/10 rounded-full animate-pulse" />
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-300 to-orange-100 rounded-full animate-spin opacity-20" />
                    </div>
                </div>
                <div className="text-center space-y-4 z-10 relative">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
                        Congratulations!
                    </h2>
                    <div className="space-y-2">
                        <p className="text-xl font-bold text-white drop-shadow-md">
                            {isWinner && contestStatus === "ended"
                                ? "🏆 YOU WON THE CONTEST! 🏆"
                                : isFirstToComplete && contestStatus === "ongoing"
                                    ? "🥇 FIRST TO SOLVE ALL! 🥇"
                                    : "🎯 CONTEST COMPLETED! 🎯"
                            }
                        </p>
                        <p className="text-lg text-orange-100 font-medium">
                            {isFirstToComplete && contestStatus === "ongoing"
                                ? `That's a huge achievement ${session?.user?.name?.split(" ")[0]}! You're the gold standard!`
                                : "Incredible work solving all problems!"
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3 text-lg font-bold z-10 relative">
                    <Icons.logo className="w-6 h-6" />
                    <span className="bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                        NextJudge
                    </span>
                    <Icons.logo className="w-6 h-6" />
                </div>
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse transform -skew-x-12" />
                </div>
            </div>
        </div>
    );
}
