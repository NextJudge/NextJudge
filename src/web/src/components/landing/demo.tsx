'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Transition } from 'motion/react';

const stages = [
    { id: 0, label: 'Queue', delay: 700 },
    { id: 1, label: 'Jail', delay: 850 },
    { id: 2, label: 'Execute', delay: 900 },
    { id: 3, label: 'Judge', delay: 1100 }
] as const;

const cursorTransition: Transition = {
    duration: 1.35,
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

export default function Demo() {
    const [activeStage, setActiveStage] = useState(-1);
    const [completedStages, setCompletedStages] = useState<Set<number>>(() => new Set());
    const [showResult, setShowResult] = useState(false);

    const [isCycling, setIsCycling] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const runButtonRef = useRef<HTMLButtonElement | null>(null);
    const runTokenRef = useRef(0);
    const isCyclingRef = useRef(false);

    const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
    const [cursorPath, setCursorPath] = useState<string | null>(null);
    const [cursorKey, setCursorKey] = useState(0);
    const [cursorPhase, setCursorPhase] = useState<'moving' | 'fading'>('moving');
    const cursorPhaseRef = useRef<'moving' | 'fading'>('moving');

    const [buttonPulse, setButtonPulse] = useState(false);

    useEffect(() => {
        cursorPhaseRef.current = cursorPhase;
    }, [cursorPhase]);

    useEffect(() => {
        isCyclingRef.current = isCycling;
    }, [isCycling]);

    const startCycle = useCallback(async (source: 'auto' | 'user') => {
        if (isCyclingRef.current) return;
        const token = ++runTokenRef.current;

        isCyclingRef.current = true;
        setIsCycling(true);
        setActiveStage(-1);
        setCompletedStages(new Set());
        setShowResult(false);

        if (source === 'auto') {
            setButtonPulse(true);
            window.setTimeout(() => setButtonPulse(false), 180);
        }

        await sleep(300);
        if (token !== runTokenRef.current) return;

        for (const stage of stages) {
            if (token !== runTokenRef.current) return;
            setActiveStage(stage.id);
            await sleep(stage.delay);
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
                                        ? { pathLength: [0, 1, 1], opacity: [0, 1, 0] }
                                        : { pathLength: 1, opacity: 0 }
                                }
                                transition={
                                    cursorPhase === 'moving'
                                        ? {
                                              duration: cursorTransition.duration,
                                              ease: cursorTransition.ease,
                                              times: [0, 0.75, 1]
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
                            initial={{ offsetDistance: '0%', opacity: 0, scale: 0.9 }}
                            animate={
                                cursorPhase === 'moving'
                                    ? { offsetDistance: '100%', opacity: 1, scale: 1 }
                                    : { offsetDistance: '100%', opacity: 0, scale: 0.9 }
                            }
                            transition={cursorPhase === 'moving' ? cursorTransition : { duration: 0.18, ease: 'easeOut' }}
                            onAnimationComplete={() => {
                                if (cursorPhaseRef.current !== 'moving') return;
                                cursorPhaseRef.current = 'fading';
                                setCursorPhase('fading');
                                runButtonRef.current?.focus();
                                startCycle('auto');
                            }}
                            aria-hidden="true"
                        >
                            <div className="relative">
                                <svg
                                    className="h-6 w-6 text-neutral-100"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M4.5 2.5L20 12.2l-7.2 1.9 2.1 7.4-3.1 1.1-2.4-7.4L4.5 2.5z" />
                                </svg>
                                <div className="absolute left-[6px] top-[6px] h-2 w-2 rounded-full bg-orange-500/90"></div>
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

                <div className="px-6 py-8 bg-gradient-to-b from-black to-neutral-950/50">
                    <div className="relative">
                        <div className="absolute top-6 left-0 right-0 h-px bg-neutral-900"></div>
                        <div
                            className="absolute top-6 left-0 h-px bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-1000 ease-out"
                            style={{
                                width: activeStage >= 0 ? `${((activeStage + 1) / stages.length) * 100}%` : '0%',
                                opacity: activeStage >= 0 ? 1 : 0
                            }}
                        ></div>

                        <div className="relative flex items-center justify-between">
                            {stages.map((stage) => {
                                const isActive = activeStage === stage.id;
                                const isCompleted = completedStages.has(stage.id);

                                return (
                                    <div key={stage.id} className="flex flex-col items-center gap-3">
                                        <div className={`relative w-12 h-12 rounded-full border transition-all duration-500 flex items-center justify-center ${isActive
                                                ? 'bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/30 scale-110'
                                                : isCompleted
                                                    ? 'bg-neutral-900 border-neutral-800'
                                                    : 'bg-black border-neutral-900'
                                            }`}>
                                            {isActive && (
                                                <div className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20"></div>
                                            )}
                                            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-white scale-150' : isCompleted ? 'bg-neutral-700' : 'bg-neutral-800'
                                                }`}></div>
                                        </div>
                                        <span className={`text-xs font-medium tracking-wide transition-all duration-300 ${isActive ? 'text-orange-500' : isCompleted ? 'text-neutral-500' : 'text-neutral-700'
                                            }`}>
                                            {stage.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className={`border-t border-neutral-900/50 transition-all duration-700 ${showResult ? 'opacity-100 max-h-24' : 'opacity-0 max-h-0 overflow-hidden'
                    }`}>
                    <div className="px-6 py-4 bg-gradient-to-b from-neutral-950/50 to-black">
                        <div className="flex items-center justify-between">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
