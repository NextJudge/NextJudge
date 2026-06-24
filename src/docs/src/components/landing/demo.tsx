'use client';

import { Code2, Server, User } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const stages = [
    { id: 0, label: 'Queue', delay: 1200 },
    { id: 1, label: 'Jail', delay: 1500 },
    { id: 2, label: 'Execute', delay: 2800 },
    { id: 3, label: 'Judge', delay: 1800 }
] as const;

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function Demo() {
    const [activeStage, setActiveStage] = useState(-1);
    const [completedStages, setCompletedStages] = useState<Set<number>>(() => new Set());
    const [codeIconProgress, setCodeIconProgress] = useState(0);
    const [isCycling, setIsCycling] = useState(false);
    const runButtonRef = useRef<HTMLButtonElement | null>(null);
    const runTokenRef = useRef(0);
    const isCyclingRef = useRef(false);
    const [buttonPulse, setButtonPulse] = useState(false);

    useEffect(() => {
        isCyclingRef.current = isCycling;
    }, [isCycling]);

    const startCycle = useCallback(async () => {
        if (isCyclingRef.current) return;
        const token = ++runTokenRef.current;

        isCyclingRef.current = true;
        setIsCycling(true);
        setActiveStage(-1);
        setCompletedStages(new Set());
        setCodeIconProgress(0);

        setButtonPulse(true);
        window.setTimeout(() => setButtonPulse(false), 180);

        await sleep(300);
        if (token !== runTokenRef.current) return;

        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            if (token !== runTokenRef.current) return;

            const segmentStart = i;
            const segmentEnd = i + 1;

            setActiveStage(stage.id);
            setCodeIconProgress(segmentStart);

            await sleep(stage.delay * 0.6);
            if (token !== runTokenRef.current) return;

            setCodeIconProgress(segmentEnd);
            await sleep(stage.delay * 0.4);
            if (token !== runTokenRef.current) return;

            setCompletedStages((prev) => new Set([...Array.from(prev), stage.id]));
        }

        if (token !== runTokenRef.current) return;
        await sleep(2000);
        if (token !== runTokenRef.current) return;

        setIsCycling(false);
        isCyclingRef.current = false;
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            startCycle();
        }, 800);
        return () => clearTimeout(timer);
    }, [startCycle]);

    return (
        <div className="relative w-full max-w-md select-none" aria-hidden>
            <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between px-3 py-2 bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">solution.cpp</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="text-[10px] text-[hsl(var(--muted-foreground))]">C++17</div>
                        <motion.button
                            ref={runButtonRef}
                            type="button"
                            disabled={isCycling}
                            onClick={startCycle}
                            animate={buttonPulse ? { scale: 0.96 } : { scale: 1 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className={`relative inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition ${isCycling
                                    ? 'cursor-not-allowed border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                                    : 'border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/15 hover:text-orange-300'
                                }`}
                            aria-label="Run demo pipeline"
                        >
                            <span className="font-mono">{isCycling ? 'Running…' : 'Run'}</span>
                        </motion.button>
                    </div>
                </div>

                <div className="px-3 py-2 bg-[hsl(var(--muted))]">
                    <pre className="text-[9px] leading-4 font-mono">
                        <code>
                            <span className="text-[hsl(var(--muted-foreground))]">1</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">  </span>
                            <span className="text-orange-400">vector</span>
                            <span className="text-[hsl(var(--foreground))] opacity-60">{'<'}</span>
                            <span className="text-orange-400">int</span>
                            <span className="text-[hsl(var(--foreground))] opacity-60">{'>'}</span>
                            <span className="text-[hsl(var(--foreground))]"> twoSum</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">(</span>
                            <span className="text-orange-400">vector</span>
                            <span className="text-[hsl(var(--foreground))] opacity-60">{'<'}</span>
                            <span className="text-orange-400">int</span>
                            <span className="text-[hsl(var(--foreground))] opacity-60">{'>&'}</span>
                            <span className="text-[hsl(var(--foreground))]"> nums</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">, </span>
                            <span className="text-orange-400">int</span>
                            <span className="text-[hsl(var(--foreground))]"> target</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">) {'{'}</span>
                            {'\n'}
                            <span className="text-[hsl(var(--muted-foreground))]">2</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">      </span>
                            <span className="text-orange-400">unordered_map</span>
                            <span className="text-[hsl(var(--foreground))] opacity-60">{'<'}</span>
                            <span className="text-orange-400">int</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">, </span>
                            <span className="text-orange-400">int</span>
                            <span className="text-[hsl(var(--foreground))] opacity-60">{'>'}</span>
                            <span className="text-[hsl(var(--foreground))]"> seen</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">;</span>
                            {'\n'}
                            <span className="text-[hsl(var(--muted-foreground))]">3</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">      </span>
                            <span className="text-orange-400">for </span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">(</span>
                            <span className="text-orange-400">int</span>
                            <span className="text-[hsl(var(--foreground))]"> i </span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">= </span>
                            <span className="text-orange-300">0</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">; i {'<'} nums.size(); i++) {'{'}</span>
                            {'\n'}
                            <span className="text-[hsl(var(--muted-foreground))]">4</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">          </span>
                            <span className="text-orange-400">if </span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">(seen.count(target - nums[i]))</span>
                            {'\n'}
                            <span className="text-[hsl(var(--muted-foreground))]">5</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">              </span>
                            <span className="text-orange-400">return </span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">{'{'}</span>
                            <span className="text-[hsl(var(--foreground))]">seen</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">[target - nums[i]], i{'}'}</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">;</span>
                            {'\n'}
                            <span className="text-[hsl(var(--muted-foreground))]">6</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">      {'}'}</span>
                            {'\n'}
                            <span className="text-[hsl(var(--muted-foreground))]">7</span>
                            <span className="text-[hsl(var(--muted-foreground))] opacity-70">  {'}'}</span>
                        </code>
                    </pre>
                </div>

                <div className="px-4 py-6 bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--muted))]">
                    <div className="relative">
                        <div className="flex items-center justify-between">
                            {stages.map((stage, index) => {
                                const isActive = activeStage === stage.id;
                                const isCompleted = completedStages.has(stage.id);
                                const isPast = activeStage > stage.id || isCompleted;
                                const segmentStart = index;
                                const segmentEnd = index + 1;
                                const isCodeIconInSegment = codeIconProgress >= segmentStart && codeIconProgress <= segmentEnd;
                                const segmentProgress = isCodeIconInSegment
                                    ? Math.max(0, Math.min(1, (codeIconProgress - segmentStart) / (segmentEnd - segmentStart)))
                                    : codeIconProgress > segmentEnd
                                        ? 1
                                        : 0;

                                return (
                                    <React.Fragment key={stage.id}>
                                        <div className="flex flex-col items-center gap-2 flex-1">
                                            <div className="relative w-full flex justify-center">
                                                <div
                                                    className={`relative transition-all duration-500 ${isActive
                                                        ? 'scale-110'
                                                        : isCompleted
                                                            ? 'scale-100'
                                                            : 'scale-95'
                                                        }`}
                                                >
                                                    <div
                                                        className={`relative w-10 h-10 rounded-lg border-2 transition-all duration-500 flex items-center justify-center ${isActive
                                                            ? 'bg-orange-500/20 border-orange-500 shadow-lg shadow-orange-500/30'
                                                            : isCompleted
                                                                ? 'bg-[hsl(var(--muted))] border-orange-500/30'
                                                                : 'bg-[hsl(var(--muted))] border-[hsl(var(--border))]'
                                                            }`}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute inset-0 rounded-lg bg-orange-500/20 animate-pulse"></div>
                                                        )}
                                                        <Server
                                                            className={`w-5 h-5 transition-all duration-300 ${isActive
                                                                ? 'text-orange-400'
                                                                : isCompleted
                                                                    ? 'text-orange-500/60'
                                                                    : 'text-[hsl(var(--muted-foreground))]'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <span
                                                className={`text-[10px] font-medium tracking-wide transition-all duration-300 ${isActive
                                                    ? 'text-orange-400'
                                                    : isCompleted
                                                        ? 'text-orange-500/70'
                                                        : 'text-[hsl(var(--muted-foreground))]'
                                                    }`}
                                            >
                                                {stage.label}
                                            </span>
                                        </div>
                                        {index < stages.length - 1 && (
                                            <div className="flex-1 mx-1.5 relative h-10">
                                                <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-[hsl(var(--border))]">
                                                    <motion.div
                                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-600"
                                                        initial={{ width: '0%' }}
                                                        animate={{
                                                            width: isPast || isActive ? '100%' : activeStage > index ? '100%' : '0%'
                                                        }}
                                                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                                                    />
                                                </div>
                                                {(isCodeIconInSegment || (codeIconProgress === 0 && index === 0)) && (
                                                    <motion.div
                                                        className="absolute top-1/2 left-0 -translate-y-1/2"
                                                        initial={false}
                                                        animate={{
                                                            left: codeIconProgress === 0 ? '0%' : `${segmentProgress * 100}%`
                                                        }}
                                                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                                                    >
                                                        <div className="relative -translate-x-1/2">
                                                            <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-md"></div>
                                                            <div className="relative w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center border-2 border-orange-400 shadow-lg">
                                                                {codeIconProgress === 0 ? (
                                                                    <User className="w-3 h-3 text-white" />
                                                                ) : (
                                                                    <Code2 className="w-3 h-3 text-white" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
