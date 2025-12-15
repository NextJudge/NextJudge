'use client';

import { Code2, MousePointer, MousePointerClick, Server } from 'lucide-react';
import type { Transition } from 'motion/react';
import { motion } from 'motion/react';
import React, { Children, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ItemIndexContext, SequenceContext } from '../ui/terminal';

const SimpleSequenceProvider = ({ children, startImmediately = false, resetKey }: { children: React.ReactNode; startImmediately?: boolean; resetKey?: number | null }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [hasStarted, setHasStarted] = useState(startImmediately);

    useEffect(() => {
        if (startImmediately) {
            setHasStarted(true);
        }
    }, [startImmediately]);

    useEffect(() => {
        if (resetKey !== undefined) {
            setActiveIndex(0);
            setHasStarted(startImmediately);
        }
    }, [resetKey, startImmediately]);

    const contextValue = useMemo(() => ({
        completeItem: (index: number) => {
            setActiveIndex((current) => (index === current ? current + 1 : current));
        },
        activeIndex,
        sequenceStarted: hasStarted,
    }), [activeIndex, hasStarted]);

    const wrappedChildren = useMemo(() => {
        const array = Children.toArray(children);
        return array.map((child, index) => (
            <ItemIndexContext.Provider key={index} value={index}>
                {child as React.ReactNode}
            </ItemIndexContext.Provider>
        ));
    }, [children]);

    return (
        <SequenceContext.Provider value={contextValue}>
            {wrappedChildren}
        </SequenceContext.Provider>
    );
};

const stages = [
    { id: 0, label: 'Queue', delay: 1200 },
    { id: 1, label: 'Jail', delay: 1500 },
    { id: 2, label: 'Execute', delay: 2800 },
    { id: 3, label: 'Judge', delay: 1800 }
] as const;

const cursorTransition: Transition = {
    duration: 2.6,
    ease: 'easeInOut'
};

type Point = { x: number; y: number };

function buildCursorPath(start: Point, end: Point) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy);
    const lift = Math.min(260, Math.max(120, distance * 0.35));

    const c1 = { x: start.x + dx * 0.25, y: start.y - lift };
    const c2 = { x: start.x + dx * 0.75, y: end.y + lift * 0.15 };

    return `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const generateQueueLogs = (): TerminalLog[] => [
    { text: '[INFO] Submission received: solution.cpp', delay: 50, className: 'text-blue-400/80' },
    { text: '[INFO] Language detected: C++17', delay: 100, className: 'text-blue-400/80' },
    { text: '[INFO] Assigning submission ID: #2847', delay: 150, className: 'text-blue-400/80' },
    { text: '[INFO] Queued for processing...', delay: 200, className: 'text-orange-500/80' },
    { text: '[INFO] Position in queue: 1/1', delay: 250, className: 'text-neutral-500' },
];

const generateJailLogs = (): TerminalLog[] => [
    { text: '[INFO] Initializing sandbox environment...', delay: 50, className: 'text-blue-400/80' },
    { text: '[INFO] Creating isolated filesystem', delay: 100, className: 'text-blue-400/80' },
    { text: '[INFO] Setting resource limits: CPU=2s, MEM=256MB', delay: 150, className: 'text-blue-400/80' },
    { text: '[INFO] Mounting read-only problem data', delay: 200, className: 'text-blue-400/80' },
    { text: '[INFO] Jail initialized successfully', delay: 250, className: 'text-green-400/80' },
];

const generateExecuteLogs = (): TerminalLog[] => [
    { text: '[INFO] Compiling solution.cpp...', delay: 50, className: 'text-blue-400/80' },
    { text: '[INFO] g++ -std=c++17 -O2 -Wall solution.cpp -o solution', delay: 100, className: 'text-neutral-500' },
    { text: '[INFO] Compilation successful', delay: 200, className: 'text-green-400/80' },
    { text: '[INFO] Running test case 1/10...', delay: 250, className: 'text-orange-400' },
    { text: '[INFO] Test case 1: PASSED (8ms)', delay: 300, className: 'text-green-400/80' },
    { text: '[INFO] Running test case 2/10...', delay: 350, className: 'text-orange-400' },
    { text: '[INFO] Test case 2: PASSED (7ms)', delay: 400, className: 'text-green-400/80' },
    { text: '[INFO] Running test case 3/10...', delay: 450, className: 'text-orange-400' },
    { text: '[INFO] Test case 3: PASSED (9ms)', delay: 500, className: 'text-green-400/80' },
    { text: '[INFO] Running test case 4/10...', delay: 550, className: 'text-orange-400' },
    { text: '[INFO] Test case 4: PASSED (8ms)', delay: 600, className: 'text-green-400/80' },
    { text: '[INFO] Running test case 5/10...', delay: 650, className: 'text-orange-400' },
    { text: '[INFO] Test case 5: PASSED (7ms)', delay: 700, className: 'text-green-400/80' },
    { text: '[INFO] Running test case 6/10...', delay: 750, className: 'text-orange-400' },
    { text: '[INFO] Test case 6: PASSED (9ms)', delay: 800, className: 'text-green-400/80' },
    { text: '[INFO] Running test case 7/10...', delay: 850, className: 'text-orange-400' },
    { text: '[INFO] Test case 7: PASSED (8ms)', delay: 900, className: 'text-green-400/80' },
    { text: '[INFO] Running test case 8/10...', delay: 950, className: 'text-orange-400' },
    { text: '[INFO] Test case 8: PASSED (7ms)', delay: 1000, className: 'text-green-400/80' },
    { text: '[INFO] Running test case 9/10...', delay: 1050, className: 'text-orange-400' },
    { text: '[INFO] Test case 9: PASSED (9ms)', delay: 1100, className: 'text-green-400/80' },
    { text: '[INFO] Running test case 10/10...', delay: 1150, className: 'text-orange-400' },
    { text: '[INFO] Test case 10: PASSED (8ms)', delay: 1200, className: 'text-green-400/80' },
];

const generateJudgeLogs = (): TerminalLog[] => [
    { text: '[INFO] All test cases completed', delay: 50, className: 'text-green-400/80' },
    { text: '[INFO] Verifying output correctness...', delay: 100, className: 'text-blue-400/80' },
    { text: '[INFO] Memory usage: 10.2 MB (within limits)', delay: 150, className: 'text-blue-400/80' },
    { text: '[INFO] Runtime: 8ms (average)', delay: 200, className: 'text-blue-400/80' },
    { text: '[INFO] Verdict: ACCEPTED', delay: 250, className: 'text-green-400' },
];

type TerminalLog = { text: string; delay: number; className?: string };

export default function Demo() {
    const [activeStage, setActiveStage] = useState(-1);
    const [completedStages, setCompletedStages] = useState<Set<number>>(() => new Set());
    const [showResult, setShowResult] = useState(false);
    const [codeIconProgress, setCodeIconProgress] = useState(0);
    const [cycleStartTime, setCycleStartTime] = useState<number | null>(null);
    const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);

    const [isCycling, setIsCycling] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const runButtonRef = useRef<HTMLButtonElement | null>(null);
    const terminalRef = useRef<HTMLDivElement | null>(null);
    const runTokenRef = useRef(0);
    const isCyclingRef = useRef(false);

    const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
    const [cursorPath, setCursorPath] = useState<string | null>(null);
    const [cursorKey, setCursorKey] = useState(0);
    const [cursorPhase, setCursorPhase] = useState<'moving' | 'fading'>('moving');
    const cursorPhaseRef = useRef<'moving' | 'fading'>('moving');
    const [isClicking, setIsClicking] = useState(false);

    const [buttonPulse, setButtonPulse] = useState(false);

    useEffect(() => {
        cursorPhaseRef.current = cursorPhase;
    }, [cursorPhase]);

    useEffect(() => {
        isCyclingRef.current = isCycling;
    }, [isCycling]);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalLogs]);

    const startCycle = useCallback(async (source: 'auto' | 'user') => {
        if (isCyclingRef.current) return;
        const token = ++runTokenRef.current;

        isCyclingRef.current = true;
        setIsCycling(true);
        setActiveStage(-1);
        setCompletedStages(new Set());
        setShowResult(false);
        setCodeIconProgress(0);
        setCycleStartTime(Date.now());
        setTerminalLogs([]);

        if (source === 'auto') {
            setButtonPulse(true);
            window.setTimeout(() => setButtonPulse(false), 180);
        }

        await sleep(300);
        if (token !== runTokenRef.current) return;

        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            if (token !== runTokenRef.current) return;

            const segmentStart = i;
            const segmentEnd = i + 1;

            setActiveStage(stage.id);
            setCodeIconProgress(segmentStart);

            let stageLogs: TerminalLog[] = [];
            if (stage.id === 0) {
                stageLogs = generateQueueLogs();
            } else if (stage.id === 1) {
                stageLogs = generateJailLogs();
            } else if (stage.id === 2) {
                stageLogs = generateExecuteLogs();
            } else if (stage.id === 3) {
                stageLogs = generateJudgeLogs();
            }

            const stageDuration = stage.delay * 0.6;
            const logInterval = stageDuration / (stageLogs.length + 1);

            for (let j = 0; j < stageLogs.length; j++) {
                if (token !== runTokenRef.current) return;
                await sleep(logInterval);
                if (token !== runTokenRef.current) return;
                setTerminalLogs((prev) => [...prev, stageLogs[j]]);
            }

            const remainingTime = stageDuration - (logInterval * stageLogs.length);
            if (remainingTime > 0) {
                await sleep(remainingTime);
                if (token !== runTokenRef.current) return;
            }

            setCodeIconProgress(segmentEnd);
            await sleep(stage.delay * 0.4);
            if (token !== runTokenRef.current) return;

            setCompletedStages((prev) => new Set([...Array.from(prev), stage.id]));
        }

        if (token !== runTokenRef.current) return;
        setShowResult(true);
        await sleep(2000);
        if (token !== runTokenRef.current) return;

        setIsCycling(false);
        isCyclingRef.current = false;

        window.setTimeout(() => {
            if (token !== runTokenRef.current) return;
            cursorPhaseRef.current = 'moving';
            setCursorPhase('moving');
            setCursorKey((k) => k + 1);
        }, 650);
    }, []);

    const updateCursorPath = useCallback(() => {
        const container = containerRef.current;
        const button = runButtonRef.current;
        if (!container || !button) return;

        const containerRect = container.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        const end: Point = {
            x: buttonRect.left - containerRect.left + buttonRect.width / 2,
            y: buttonRect.top - containerRect.top + buttonRect.height / 2
        };

        const start: Point = {
            x: -52,
            y: Math.min(containerRect.height - 30, Math.max(28, containerRect.height * 0.32))
        };

        setCursorPath(buildCursorPath(start, end));
        setContainerSize({ w: containerRect.width, h: containerRect.height });
    }, []);

    useLayoutEffect(() => {
        updateCursorPath();
    }, [updateCursorPath]);

    useEffect(() => {
        updateCursorPath();
        window.addEventListener('resize', updateCursorPath);
        const ro = new ResizeObserver(() => updateCursorPath());
        if (containerRef.current) ro.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', updateCursorPath);
            ro.disconnect();
            runTokenRef.current++;
        };
    }, [updateCursorPath]);

    const hasAutoStartedRef = useRef(false);
    useEffect(() => {
        if (!cursorPath || hasAutoStartedRef.current) return;
        hasAutoStartedRef.current = true;
        window.setTimeout(() => setCursorKey(1), 450);
    }, [cursorPath]);

    useEffect(() => {
        if (cursorKey <= 0) return;
        cursorPhaseRef.current = 'moving';
        setCursorPhase('moving');
        setIsClicking(false);
    }, [cursorKey]);

    const cursorStyle = cursorPath
        ? ({
              width: 24,
              height: 24,
              position: 'absolute',
              top: 0,
              left: 0,
              offsetPath: `path("${cursorPath}")`,
              offsetRotate: '0deg',
              filter: 'drop-shadow(0 6px 10px rgba(0, 0, 0, 0.6))'
          } as React.CSSProperties)
        : undefined;

    return (
        <div ref={containerRef} className="relative w-full max-w-3xl" aria-hidden>
            {cursorPath && (
                <div className="pointer-events-none absolute inset-0 z-20">
                    {containerSize && cursorKey > 0 && (
                        <svg
                            className="absolute inset-0 h-full w-full overflow-visible"
                            width={containerSize.w}
                            height={containerSize.h}
                            viewBox={`0 0 ${containerSize.w} ${containerSize.h}`}
                            aria-hidden="true"
                        >
                            <motion.path
                                key={cursorKey}
                                d={cursorPath}
                                fill="transparent"
                                strokeWidth="2"
                                stroke="rgba(249, 115, 22, 0.18)"
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={
                                    cursorPhase === 'moving'
                                        ? { pathLength: [0, 1], opacity: [0, 1, 0] }
                                        : { pathLength: 1, opacity: 0 }
                                }
                                transition={
                                    cursorPhase === 'moving'
                                        ? {
                                            pathLength: {
                                                duration: cursorTransition.duration,
                                                ease: cursorTransition.ease,
                                                times: [0, 1]
                                            },
                                            opacity: {
                                                duration: cursorTransition.duration,
                                                ease: cursorTransition.ease,
                                                times: [0, 0.95, 1]
                                            }
                                          }
                                        : { duration: 0.18, ease: 'easeOut' }
                                }
                            />
                        </svg>
                    )}

                    {cursorKey > 0 && (
                        <motion.div
                            key={cursorKey}
                            style={cursorStyle}
                            className="relative z-50"
                            initial={{ offsetDistance: '0%', opacity: 0, scale: 0.9 }}
                            animate={
                                cursorPhase === 'moving'
                                    ? { offsetDistance: '100%', opacity: 1, scale: 1 }
                                    : { offsetDistance: '100%', opacity: 0, scale: 0.9 }
                            }
                            transition={cursorPhase === 'moving' ? cursorTransition : { duration: 0.18, ease: 'easeOut' }}
                            onAnimationComplete={() => {
                                if (cursorPhaseRef.current !== 'moving') return;
                                setIsClicking(true);
                                setTimeout(() => {
                                    cursorPhaseRef.current = 'fading';
                                    setCursorPhase('fading');
                                    runButtonRef.current?.focus();
                                    startCycle('auto');
                                }, 150);
                            }}
                            aria-hidden="true"
                        >
                            <div className="relative">
                                {isClicking ? (
                                    <MousePointerClick className="h-6 w-6 text-osu" />
                                ) : (
                                    <MousePointer className="h-6 w-6 text-secondary-foreground" />
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            <div className="bg-black rounded-lg border border-neutral-800/50 overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-neutral-950/80 border-b border-neutral-900/50">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-neutral-800"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-neutral-800"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-neutral-800"></div>
                        </div>
                        <span className="text-xs text-neutral-600 font-mono">solution.cpp</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-neutral-700">C++17</div>
                        <motion.button
                            ref={runButtonRef}
                            type="button"
                            disabled={isCycling}
                            onClick={() => startCycle('user')}
                            animate={buttonPulse ? { scale: 0.96 } : { scale: 1 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className={`relative inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition ${isCycling
                                    ? 'cursor-not-allowed border-neutral-900 bg-neutral-950/40 text-neutral-700'
                                    : 'border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/15 hover:text-orange-300'
                                }`}
                            aria-label="Run demo pipeline"
                        >
                            <span className="font-mono">{isCycling ? 'Running…' : 'Run'}</span>
                        </motion.button>
                    </div>
                </div>

                <div className="px-4 py-4 bg-neutral-950/50">
                    <pre className="text-[11px] leading-5 font-mono">
                        <code>
                            <span className="text-neutral-600">1</span>
                            <span className="text-neutral-500">  </span>
                            <span className="text-orange-400">vector</span>
                            <span className="text-neutral-400">{'<'}</span>
                            <span className="text-orange-400">int</span>
                            <span className="text-neutral-400">{'>'}</span>
                            <span className="text-neutral-300"> twoSum</span>
                            <span className="text-neutral-500">(</span>
                            <span className="text-orange-400">vector</span>
                            <span className="text-neutral-400">{'<'}</span>
                            <span className="text-orange-400">int</span>
                            <span className="text-neutral-400">{'>&'}</span>
                            <span className="text-neutral-300"> nums</span>
                            <span className="text-neutral-500">, </span>
                            <span className="text-orange-400">int</span>
                            <span className="text-neutral-300"> target</span>
                            <span className="text-neutral-500">) {'{'}</span>
                            {'\n'}
                            <span className="text-neutral-600">2</span>
                            <span className="text-neutral-500">      </span>
                            <span className="text-orange-400">unordered_map</span>
                            <span className="text-neutral-400">{'<'}</span>
                            <span className="text-orange-400">int</span>
                            <span className="text-neutral-500">, </span>
                            <span className="text-orange-400">int</span>
                            <span className="text-neutral-400">{'>'}</span>
                            <span className="text-neutral-300"> seen</span>
                            <span className="text-neutral-500">;</span>
                            {'\n'}
                            <span className="text-neutral-600">3</span>
                            <span className="text-neutral-500">      </span>
                            <span className="text-orange-400">for </span>
                            <span className="text-neutral-500">(</span>
                            <span className="text-orange-400">int</span>
                            <span className="text-neutral-300"> i </span>
                            <span className="text-neutral-500">= </span>
                            <span className="text-orange-300">0</span>
                            <span className="text-neutral-500">; i {'<'} nums.size(); i++) {'{'}</span>
                            {'\n'}
                            <span className="text-neutral-600">4</span>
                            <span className="text-neutral-500">          </span>
                            <span className="text-orange-400">if </span>
                            <span className="text-neutral-500">(seen.count(target - nums[i]))</span>
                            {'\n'}
                            <span className="text-neutral-600">5</span>
                            <span className="text-neutral-500">              </span>
                            <span className="text-orange-400">return </span>
                            <span className="text-neutral-500">{'{'}</span>
                            <span className="text-neutral-300">seen</span>
                            <span className="text-neutral-500">[target - nums[i]], i{'}'}</span>
                            <span className="text-neutral-500">;</span>
                            {'\n'}
                            <span className="text-neutral-600">6</span>
                            <span className="text-neutral-500">      {'}'}</span>
                            {'\n'}
                            <span className="text-neutral-600">7</span>
                            <span className="text-neutral-500">  {'}'}</span>
                        </code>
                    </pre>
                </div>

                <div className="px-6 py-10 bg-gradient-to-b from-black to-neutral-950/50">
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
                                        <div className="flex flex-col items-center gap-4 flex-1">
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
                                                        className={`relative w-14 h-14 rounded-lg border-2 transition-all duration-500 flex items-center justify-center ${isActive
                                                            ? 'bg-orange-500/20 border-orange-500 shadow-lg shadow-orange-500/30'
                                                            : isCompleted
                                                                ? 'bg-neutral-900/50 border-orange-500/30'
                                                                : 'bg-neutral-950/50 border-neutral-800'
                                                            }`}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute inset-0 rounded-lg bg-orange-500/20 animate-pulse"></div>
                                                        )}
                                                        <Server
                                                            className={`w-7 h-7 transition-all duration-300 ${isActive
                                                                ? 'text-orange-400'
                                                                : isCompleted
                                                                    ? 'text-orange-500/60'
                                                                    : 'text-neutral-700'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <span
                                                className={`text-xs font-medium tracking-wide transition-all duration-300 ${isActive
                                                    ? 'text-orange-400'
                                                    : isCompleted
                                                        ? 'text-orange-500/70'
                                                        : 'text-neutral-600'
                                                    }`}
                                            >
                                                {stage.label}
                                            </span>
                                        </div>
                                        {index < stages.length - 1 && (
                                            <div className="flex-1 mx-2 relative h-14">
                                                <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-neutral-900">
                                                    <motion.div
                                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-600"
                                                        initial={{ width: '0%' }}
                                                        animate={{
                                                            width: isPast || isActive ? '100%' : activeStage > index ? '100%' : '0%'
                                                        }}
                                                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                                                    />
                                                </div>
                                                {isCodeIconInSegment && (
                                                    <motion.div
                                                        className="absolute top-1/2 left-0 -translate-y-1/2"
                                                        initial={false}
                                                        animate={{
                                                            left: `${segmentProgress * 100}%`
                                                        }}
                                                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                                                    >
                                                        <div className="relative -translate-x-1/2">
                                                            <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-md"></div>
                                                            <div className="relative w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center border-2 border-orange-400 shadow-lg">
                                                                <Code2 className="w-4 h-4 text-white" />
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

                <div className="border-t border-neutral-900/50 h-[88px] relative">
                    <div className="absolute inset-0 px-6 py-4 bg-gradient-to-b from-neutral-950/50 to-black">
                        {showResult ? (
                            <motion.div
                                className="h-full flex items-center justify-between"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-orange-500">Accepted</div>
                                        <div className="text-xs text-neutral-600 mt-0.5">8ms runtime</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-neutral-700 mb-0.5">Memory</div>
                                    <div className="text-sm font-mono text-neutral-500">10.2 MB</div>
                                </div>
                            </motion.div>
                        ) : (
                            <div ref={terminalRef} className="h-full flex items-start overflow-y-auto overflow-x-hidden">
                                <div className="grid gap-y-0.5 font-mono text-xs w-full py-1">
                                    <div className="text-neutral-400">$ nextjudge submit solution.cpp</div>
                                    {terminalLogs.map((log, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className={log.className || 'text-neutral-500'}
                                        >
                                            {log.text}
                                        </motion.div>
                                    ))}
                                    {isCycling && (
                                        <motion.div
                                            className="text-orange-400/60"
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            ▋
                                        </motion.div>
                                    )}
                                </div>
                                </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
