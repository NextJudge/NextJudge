import React, { useState, useEffect } from 'react';

export default function Demo() {
    const [activeStage, setActiveStage] = useState(-1);
    const [completedStages, setCompletedStages] = useState(new Set());
    const [showResult, setShowResult] = useState(false);

    const stages = [
        { id: 0, label: 'Queue', delay: 700 },
        { id: 1, label: 'Sandbox', delay: 850 },
        { id: 2, label: 'Execute', delay: 900 },
        { id: 3, label: 'Validate', delay: 1100 }
    ];

    useEffect(() => {
        let isMounted = true;

        const runCycle = async () => {
            if (!isMounted) return;

            setActiveStage(-1);
            setCompletedStages(new Set());
            setShowResult(false);

            await new Promise(resolve => setTimeout(resolve, 300));

            for (const stage of stages) {
                if (!isMounted) return;
                setActiveStage(stage.id);
                await new Promise(resolve => setTimeout(resolve, stage.delay));
                if (!isMounted) return;
                setCompletedStages(prev => new Set([...Array.from(prev), stage.id]));
            }

            if (!isMounted) return;
            setShowResult(true);
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (isMounted) runCycle();
        };

        runCycle();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="w-full max-w-3xl">
            <div className="bg-black rounded-lg border border-neutral-800/50 overflow-hidden backdrop-blur-sm">
                {/* Editor Header */}
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
                    </div>
                </div>

                {/* Code Block */}
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

                {/* Pipeline Visualization */}
                <div className="px-6 py-8 bg-gradient-to-b from-black to-neutral-950/50">
                    <div className="relative">
                        {/* Progress Track */}
                        <div className="absolute top-6 left-0 right-0 h-px bg-neutral-900"></div>
                        <div
                            className="absolute top-6 left-0 h-px bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-1000 ease-out"
                            style={{
                                width: activeStage >= 0 ? `${((activeStage + 1) / stages.length) * 100}%` : '0%',
                                opacity: activeStage >= 0 ? 1 : 0
                            }}
                        ></div>

                        {/* Stage Nodes */}
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

                {/* Result Panel */}
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