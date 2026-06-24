'use client'

import { Card, CardHeader } from '@/components/ui/card'
import { SITE_URLS } from '@/lib/site'
import { cn } from '@/lib/utils'
import { CheckCircle, GitBranch, LucideIcon, Server, Trophy, XCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useEffect, useRef, useState } from 'react'

type ProblemStatus =
    | { solved: true; attempts: number; time: number }
    | { solved: false; attempts: number }
    | null

interface LeaderboardEntry {
    rank: number
    name: string
    solved: number
    totalTime: string
    problemA: ProblemStatus
    problemB: ProblemStatus
    problemC: ProblemStatus
}

const mockLeaderboardData: LeaderboardEntry[] = [
    { rank: 1, name: 'Tom Nyuma', solved: 3, totalTime: '1h 42m', problemA: { solved: true, attempts: 1, time: 18 }, problemB: { solved: true, attempts: 2, time: 35 }, problemC: { solved: true, attempts: 1, time: 49 } },
    { rank: 2, name: 'Otso Barron', solved: 3, totalTime: '2h 15m', problemA: { solved: true, attempts: 2, time: 24 }, problemB: { solved: true, attempts: 1, time: 52 }, problemC: { solved: true, attempts: 3, time: 59 } },
    { rank: 3, name: 'Jordan Brantner', solved: 2, totalTime: '1h 58m', problemA: { solved: true, attempts: 1, time: 31 }, problemB: { solved: true, attempts: 4, time: 87 }, problemC: { solved: false, attempts: 5 } },
    { rank: 4, name: 'Andrew Dang', solved: 2, totalTime: '2h 31m', problemA: { solved: true, attempts: 3, time: 45 }, problemB: { solved: false, attempts: 2 }, problemC: { solved: true, attempts: 2, time: 106 } },
    { rank: 5, name: 'Aisha Patel', solved: 2, totalTime: '2h 44m', problemA: { solved: false, attempts: 4 }, problemB: { solved: true, attempts: 1, time: 67 }, problemC: { solved: true, attempts: 2, time: 97 } },
]

const ProblemCell = ({ status }: { status: ProblemStatus }) => {
    if (!status) {
        return <div className="h-5 w-12 rounded bg-muted" />
    }

    if (status.solved) {
        return (
            <div className="flex h-5 w-12 items-center justify-center rounded bg-emerald-600 text-[10px] font-medium text-white">
                {status.attempts}/{status.time}
            </div>
        )
    }

    return (
        <div className="flex h-5 w-12 items-center justify-center rounded bg-primary text-[10px] font-medium text-primary-foreground">
            {status.attempts}/--
        </div>
    )
}

const MockLeaderboard = () => (
    <div className="w-full overflow-x-auto rounded-md border border-osu/60 bg-black/70 text-xs shadow-sm">
        <div className="flex items-center justify-between border-b border-osu/50 px-2 sm:px-3 py-2 bg-black/60">
            <h3 className="text-xs sm:text-sm font-semibold text-white">Leaderboard</h3>
            <span className="rounded bg-emerald-600/30 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] text-emerald-200 whitespace-nowrap">
                Sample contest
            </span>
        </div>

        <table className="w-full text-white min-w-[400px]">
            <thead>
                <tr className="border-b border-osu/40 text-[9px] sm:text-[10px] text-gray-300">
                    <th className="px-1 sm:px-2 py-1 sm:py-1.5 text-left font-medium">#</th>
                    <th className="px-1 sm:px-2 py-1 sm:py-1.5 text-left font-medium">Participant</th>
                    <th className="px-1 sm:px-2 py-1 sm:py-1.5 text-center font-medium">Solved</th>
                    <th className="px-1 sm:px-2 py-1 sm:py-1.5 text-center font-medium">Time</th>
                    <th className="px-1 sm:px-2 py-1 sm:py-1.5 text-center font-medium">A</th>
                    <th className="px-1 sm:px-2 py-1 sm:py-1.5 text-center font-medium">B</th>
                    <th className="px-1 sm:px-2 py-1 sm:py-1.5 text-center font-medium">C</th>
                </tr>
            </thead>
            <tbody>
                {mockLeaderboardData.map((entry) => (
                    <tr
                        key={entry.rank}
                        className="border-b border-osu/30 text-white last:border-0 bg-black/60"
                    >
                        <td className="px-1 sm:px-2 py-1 text-gray-300">{entry.rank}</td>
                        <td className="px-1 sm:px-2 py-1 font-medium text-white truncate max-w-[80px] sm:max-w-none">{entry.name}</td>
                        <td className="px-1 sm:px-2 py-1 text-center text-white">{entry.solved}</td>
                        <td className="px-1 sm:px-2 py-1 text-center text-gray-300 whitespace-nowrap">{entry.totalTime}</td>
                        <td className="px-1 sm:px-2 py-1">
                            <div className="flex justify-center">
                                <ProblemCell status={entry.problemA} />
                            </div>
                        </td>
                        <td className="px-1 sm:px-2 py-1">
                            <div className="flex justify-center">
                                <ProblemCell status={entry.problemB} />
                            </div>
                        </td>
                        <td className="px-1 sm:px-2 py-1">
                            <div className="flex justify-center">
                                <ProblemCell status={entry.problemC} />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

type ExecutionStepStatus = 'completed' | 'running' | 'pending' | 'error'

interface ExecutionStep {
    label: string
    status: ExecutionStepStatus
    time?: string
}

type FinalResult = 'success' | 'wrong_answer' | 'runtime_error' | 'time_limit'

const getRandomTime = () => `${Math.floor(Math.random() * 50) + 5}ms`

const AnimatedExecutionFeedThemed = () => {
    const [steps, setSteps] = useState<ExecutionStep[]>([])
    const [result, setResult] = useState<FinalResult | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const timeoutsRef = useRef<number[]>([])
    const hasStartedRef = useRef(false)

    const totalTests = 5

    useEffect(() => {
        if (hasStartedRef.current) return
        hasStartedRef.current = true

        setSteps([])
        setResult(null)
        setIsRunning(true)

        setSteps([{ label: 'Compiling...', status: 'running' }])

        const compileTimeout = window.setTimeout(() => {
            setSteps([{ label: 'Compiling...', status: 'completed', time: getRandomTime() }])

            let currentTest = 1

            const runNextTest = () => {
                if (currentTest > totalTests) {
                    setResult('success')
                    setIsRunning(false)
                    return
                }

                setSteps(prev => [
                    ...prev,
                    { label: `Running test case ${currentTest}/${totalTests}`, status: 'running' }
                ])

                const testTimeout = window.setTimeout(() => {
                    setSteps(prev => {
                        const updated = [...prev]
                        updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            status: 'completed',
                            time: getRandomTime()
                        }
                        return updated
                    })

                    currentTest++
                    const nextTimeout = window.setTimeout(runNextTest, 400 + Math.random() * 300)
                    timeoutsRef.current.push(nextTimeout)
                }, 500 + Math.random() * 400)
                timeoutsRef.current.push(testTimeout)
            }

            const firstTestTimeout = window.setTimeout(runNextTest, 300)
            timeoutsRef.current.push(firstTestTimeout)
        }, 600)

        timeoutsRef.current.push(compileTimeout)

        return () => {
            timeoutsRef.current.forEach(clearTimeout)
            timeoutsRef.current = []
            hasStartedRef.current = false
        }
    }, [])

    const resultConfig: Record<FinalResult, { label: string; className: string }> = {
        success: { label: 'All tests passed!', className: 'bg-emerald-600 text-white' },
        wrong_answer: { label: 'Wrong Answer on test case', className: 'bg-red-600 text-white' },
        runtime_error: { label: 'Runtime Error', className: 'bg-orange-600 text-white' },
        time_limit: { label: 'Time Limit Exceeded', className: 'bg-amber-600 text-white' },
    }

    return (
        <div className="h-[280px] overflow-y-auto overflow-x-hidden space-y-2 rounded-md border border-osu/60 bg-black/70 p-2 sm:p-3 text-xs shadow-sm">
            {steps.map((step, i) => (
                <div key={`${step.label}-${i}`} className="flex items-center justify-between gap-1.5 sm:gap-2 bg-black/60 rounded px-1.5 sm:px-2 py-1 sm:py-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        {step.status === 'completed' && (
                            <CheckCircle className="size-3 sm:size-3.5 text-emerald-500 shrink-0" />
                        )}
                        {step.status === 'running' && (
                            <div className="size-3 sm:size-3.5 rounded-full border-2 border-osu border-t-transparent animate-spin shrink-0" />
                        )}
                        {step.status === 'pending' && (
                            <div className="size-3 sm:size-3.5 rounded-full border border-osu/30 shrink-0" />
                        )}
                        {step.status === 'error' && (
                            <XCircle className="size-3 sm:size-3.5 text-red-500 shrink-0" />
                        )}
                        <span className={cn(
                            'text-white text-[10px] sm:text-xs truncate min-w-0',
                            step.status === 'pending' && 'text-gray-300',
                            step.status === 'error' && 'text-red-500'
                        )}>
                            {step.label}
                        </span>
                    </div>
                    {step.time && (
                        <span className={cn(
                            'text-gray-300 text-[10px] sm:text-xs whitespace-nowrap shrink-0 ml-1',
                            step.status === 'error' && 'text-red-500'
                        )}>{step.time}</span>
                    )}
                </div>
            ))}

            {result && !isRunning && (
                <div className={cn(
                    'mt-3 rounded-md px-2 sm:px-3 py-2 text-center font-medium text-xs sm:text-sm break-words',
                    resultConfig[result].className
                )}>
                    {resultConfig[result].label}
                </div>
            )}
        </div>
    )
}

export default function Features() {
    return (
        <section id="features" className="py-6 sm:py-10 md:py-14 px-2 sm:px-4 text-white overflow-x-hidden">
            <div className="relative mx-auto w-full overflow-hidden rounded-3xl">
                <div className="relative mx-auto w-full max-w-5xl px-2 sm:px-4 md:px-6 py-6 sm:py-10 md:py-14">
                    <h2 className="text-lg sm:text-2xl md:text-4xl font-medium font-sans text-center w-full mx-auto max-w-3xl px-1 sm:px-4 md:px-6 mb-4 sm:mb-8 text-white break-words">
                        Built for{' '}
                        <span className="bg-gradient-to-r from-osu to-osu text-transparent bg-clip-text font-serif italic font-semibold">
                            real contests
                        </span>
                        , not slide decks
                    </h2>
                    <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-white/70 sm:text-base">
                        Three core capabilities that are live today — automated judging, contest hosting, and self-hosting.
                    </p>

                    <div className="mx-auto grid w-full gap-4 lg:grid-cols-3">
                        <FeatureCard>
                            <CardHeader className="pb-3">
                                <CardHeading
                                    icon={Zap}
                                    title="Automated Judging"
                                    description="Submit code and get verdicts from the judge — compile, run test cases, and see pass or fail."
                                />
                            </CardHeader>
                            <div className="relative border-t border-dashed">
                                <div className="p-2 sm:p-3 px-2 sm:px-4 min-h-[180px] overflow-x-hidden">
                                    <AnimatedExecutionFeedThemed />
                                </div>
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 z-10"
                                    style={{
                                        background: 'radial-gradient(125% 125% at 50% 0%, transparent 20%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.95) 90%)'
                                    }}
                                />
                            </div>
                        </FeatureCard>

                        <FeatureCard>
                            <CardHeader className="pb-3">
                                <CardHeading
                                    icon={Trophy}
                                    title="Contests & Leaderboards"
                                    description="Create timed contests, add problems, and track standings as participants submit solutions."
                                />
                            </CardHeader>
                            <div className="relative border-t border-dashed">
                                <div className="p-2 sm:p-3 px-2 sm:px-4 bg-black/70">
                                    <MockLeaderboard />
                                </div>
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 z-10"
                                    style={{
                                        background: 'radial-gradient(125% 125% at 50% 0%, transparent 20%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.95) 90%)'
                                    }}
                                />
                            </div>
                        </FeatureCard>

                        <FeatureCard className="flex flex-col">
                            <CardHeader className="pb-3">
                                <CardHeading
                                    icon={Server}
                                    title="Self-Hostable & Open Source"
                                    description="Run NextJudge on your own infrastructure. Fork the repo, deploy with Docker, and own your data."
                                />
                            </CardHeader>
                            <div className="relative flex flex-1 flex-col justify-between border-t border-dashed p-4 sm:p-6">
                                <div className="space-y-4">
                                    <p className="text-center text-3xl font-semibold sm:text-4xl">
                                        100%{' '}
                                        <span className="relative inline-block">
                                            Open Source
                                            <svg
                                                className="absolute -bottom-3 left-0 w-full"
                                                viewBox="0 0 200 12"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                preserveAspectRatio="none"
                                                aria-hidden
                                            >
                                                <path
                                                    d="M1 5.5C32 2 62 9 95 5.5C128 2 158 8 199 5.5"
                                                    stroke="hsl(var(--primary))"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </span>
                                    </p>
                                    <ul className="space-y-2 text-sm text-white/80">
                                        <li className="flex items-start gap-2">
                                            <GitBranch className="mt-0.5 size-4 shrink-0 text-osu" />
                                            <span>MIT-licensed codebase on GitHub</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Server className="mt-0.5 size-4 shrink-0 text-osu" />
                                            <span>Docker-based judge and data layer</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                                    <Link
                                        href={SITE_URLS.production.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center rounded-full border border-osu/60 bg-osu/10 px-4 py-2 text-sm font-medium text-white hover:bg-osu/20"
                                    >
                                        View on GitHub
                                    </Link>
                                    <Link
                                        href={SITE_URLS.production.docsGettingStarted}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
                                    >
                                        Self-hosting guide
                                    </Link>
                                </div>
                            </div>
                        </FeatureCard>
                    </div>
                </div>
            </div>
        </section>
    )
}

interface FeatureCardProps {
    children: ReactNode
    className?: string
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
    <Card className={cn(
        'group relative rounded-none shadow-zinc-950/5',
        'bg-black/80 text-white border border-osu/60 backdrop-blur',
        'w-full max-w-full overflow-hidden',
        className
    )}>
        <CardDecorator />
        {children}
    </Card>
)

const CardDecorator = () => (
    <>
        <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
        <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
        <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
        <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
    </>
)

interface CardHeadingProps {
    icon: LucideIcon
    title: string
    description: string
}

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
    <div className="p-3 sm:p-5 md:p-6">
        <span className="text-gray-300 flex items-center gap-2 text-xs sm:text-base">
            <Icon className="size-3 sm:size-4" />
            {title}
        </span>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl font-semibold text-white break-words">{description}</p>
    </div>
)
