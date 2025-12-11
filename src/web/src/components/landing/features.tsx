'use client'
import { AnimatedList } from '@/components/ui/animated-list'
import { Card, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Editor } from '@monaco-editor/react'
import { Activity, CheckCircle, CircleDot, Code2, HelpCircle, LucideIcon, MessageCircle, Trophy, XCircle, Zap } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ReactNode, useCallback, useEffect, useState } from 'react'

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
    totalAttempts: number
}

const sampleCode = `import { createInterface } from 'readline';

const rl = createInterface({ input: process.stdin });
const lines: string[] = [];

rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    const t = parseInt(lines[0]);
    for (let i = 1; i <= t; i++) {
        const s = lines[i];
        console.log(s.split('').reverse().join(''));
    }
});`

const ClippedCodeEditor = () => {
    const { resolvedTheme } = useTheme()

    return (
        <div className="h-[255px] w-full overflow-hidden rounded-t-xl border-x border-t border-border/50">
            <Editor
                language="typescript"
                className="pointer-events-none select-none"
                height="400px"
                defaultLanguage="typescript"
                defaultValue={sampleCode}
                options={{
                    lineNumbers: 'off',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    readOnly: true,
                    folding: false,
                    lineDecorationsWidth: 16,
                    lineNumbersMinChars: 0,
                    renderLineHighlight: 'none',
                    scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                    padding: { top: 16 },
                }}
                theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
            />
        </div>
    )
}

const mockLeaderboardData: LeaderboardEntry[] = [
    { rank: 1, name: 'Tom Nyuma', solved: 3, totalTime: '1h 42m', problemA: { solved: true, attempts: 1, time: 18 }, problemB: { solved: true, attempts: 2, time: 35 }, problemC: { solved: true, attempts: 1, time: 49 }, totalAttempts: 4 },
    { rank: 2, name: 'Otso Barron', solved: 3, totalTime: '2h 15m', problemA: { solved: true, attempts: 2, time: 24 }, problemB: { solved: true, attempts: 1, time: 52 }, problemC: { solved: true, attempts: 3, time: 59 }, totalAttempts: 6 },
    { rank: 3, name: 'Jordan Brantner', solved: 2, totalTime: '1h 58m', problemA: { solved: true, attempts: 1, time: 31 }, problemB: { solved: true, attempts: 4, time: 87 }, problemC: { solved: false, attempts: 5 }, totalAttempts: 10 },
    { rank: 4, name: 'Andrew Dang', solved: 2, totalTime: '2h 31m', problemA: { solved: true, attempts: 3, time: 45 }, problemB: { solved: false, attempts: 2 }, problemC: { solved: true, attempts: 2, time: 106 }, totalAttempts: 7 },
    { rank: 5, name: 'Aisha Patel', solved: 2, totalTime: '2h 44m', problemA: { solved: false, attempts: 4 }, problemB: { solved: true, attempts: 1, time: 67 }, problemC: { solved: true, attempts: 2, time: 97 }, totalAttempts: 7 },
    { rank: 6, name: 'David Kim', solved: 1, totalTime: '58m', problemA: { solved: true, attempts: 2, time: 58 }, problemB: { solved: false, attempts: 3 }, problemC: null, totalAttempts: 5 },
    { rank: 7, name: 'Sofia Martinez', solved: 1, totalTime: '1h 12m', problemA: { solved: false, attempts: 1 }, problemB: { solved: true, attempts: 1, time: 72 }, problemC: { solved: false, attempts: 2 }, totalAttempts: 4 },
    { rank: 8, name: 'Ryan O\'Connor', solved: 1, totalTime: '1h 34m', problemA: { solved: true, attempts: 5, time: 94 }, problemB: { solved: false, attempts: 2 }, problemC: { solved: false, attempts: 1 }, totalAttempts: 8 },
    { rank: 9, name: 'Luna Zhang', solved: 0, totalTime: '--', problemA: { solved: false, attempts: 3 }, problemB: { solved: false, attempts: 1 }, problemC: null, totalAttempts: 4 },
    { rank: 10, name: 'Alex Thompson', solved: 0, totalTime: '--', problemA: { solved: false, attempts: 2 }, problemB: null, problemC: { solved: false, attempts: 1 }, totalAttempts: 3 },
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
    <div className="w-full overflow-hidden rounded-md border bg-card text-xs shadow-sm">
        <div className="flex items-center justify-between border-b px-3 py-2">
            <h3 className="text-sm font-semibold text-card-foreground">Leaderboard</h3>
            <span className="rounded bg-emerald-600/20 px-1.5 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                42 participants
            </span>
        </div>

        <table className="w-full">
            <thead>
                <tr className="border-b text-[10px] text-muted-foreground">
                    <th className="px-2 py-1.5 text-left font-medium">#</th>
                    <th className="px-2 py-1.5 text-left font-medium">Participant</th>
                    <th className="px-2 py-1.5 text-center font-medium">Solved</th>
                    <th className="px-2 py-1.5 text-center font-medium">Time</th>
                    <th className="px-2 py-1.5 text-center font-medium">A</th>
                    <th className="px-2 py-1.5 text-center font-medium">B</th>
                    <th className="px-2 py-1.5 text-center font-medium">C</th>
                </tr>
            </thead>
            <tbody>
                {mockLeaderboardData.map((entry) => (
                    <tr
                        key={entry.rank}
                        className="border-b border-border/50 text-card-foreground last:border-0"
                    >
                        <td className="px-2 py-1 text-muted-foreground">{entry.rank}</td>
                        <td className="px-2 py-1 font-medium">{entry.name}</td>
                        <td className="px-2 py-1 text-center">{entry.solved}</td>
                        <td className="px-2 py-1 text-center text-muted-foreground">{entry.totalTime}</td>
                        <td className="px-2 py-1">
                            <div className="flex justify-center">
                                <ProblemCell status={entry.problemA} />
                            </div>
                        </td>
                        <td className="px-2 py-1">
                            <div className="flex justify-center">
                                <ProblemCell status={entry.problemB} />
                            </div>
                        </td>
                        <td className="px-2 py-1">
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

interface MockQuestion {
    id: number
    user: string
    problem: string
    question: string
    time: string
    isAnswered: boolean
}

const mockQuestionsData: MockQuestion[] = [
    { id: 1, user: 'Sarah Chen', problem: 'Two Sum', question: 'Can we assume the input array is always sorted?', time: '2m ago', isAnswered: true },
    { id: 2, user: 'Marcus Rivera', problem: 'Binary Search', question: 'What should we return if the target is not found?', time: '5m ago', isAnswered: true },
    { id: 3, user: 'Emily Watson', problem: 'Two Sum', question: 'Is there always exactly one solution?', time: '8m ago', isAnswered: true },
    { id: 4, user: 'James Park', problem: 'Graph Traversal', question: 'Can the graph contain cycles?', time: '12m ago', isAnswered: false },
    { id: 5, user: 'Aisha Patel', problem: 'Binary Search', question: 'Should we handle duplicate values?', time: '15m ago', isAnswered: false },
]

const MockQA = ({ className }: { className?: string }) => (
    <div className={cn("flex w-full flex-col overflow-hidden rounded-md border bg-card text-xs shadow-sm", className)}>
        <div className="flex items-center justify-between border-b px-3 py-2">
            <h3 className="text-sm font-semibold text-card-foreground">Q&A</h3>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <HelpCircle className="size-3" />
                Ask a question
            </span>
        </div>

        <div className="flex-1 divide-y divide-border/50">
            {mockQuestionsData.map((q) => (
                <div key={q.id} className="flex items-start gap-2 px-3 py-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="font-medium text-card-foreground truncate">{q.user}</span>
                            <span className="shrink-0 rounded bg-secondary px-1 py-0.5 text-[9px] text-secondary-foreground">
                                {q.problem}
                            </span>
                        </div>
                        <p className="mt-0.5 text-muted-foreground line-clamp-1">{q.question}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{q.time}</span>
                        {q.isAnswered ? (
                            <span className="flex items-center gap-0.5 rounded bg-emerald-600/20 px-1 py-0.5 text-[9px] text-emerald-600 dark:text-emerald-400">
                                <CheckCircle className="size-2.5" />
                                Answered
                            </span>
                        ) : (
                            <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                                Pending
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
)

export default function Features() {
    return (
        <section className="py-16 md:py-32 px-4">
            <div className="relative mx-auto w-[90vw] md:w-[80vw] lg:w-[90vw] overflow-hidden rounded-3xl">
                <div
                    aria-hidden
                    className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900/80"
                />
                <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.5)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.5)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]"
                />

                <div className="relative mx-auto max-w-2xl px-6 py-16 md:py-24 lg:max-w-5xl">
                    <h2 className="text-2xl md:text-4xl font-medium font-sans text-center w-full mx-auto max-w-3xl px-6 mb-12">
                        NextJudge offers all the tools you need to{' '}
                        <span className="bg-gradient-to-r from-osu to-osu text-transparent bg-clip-text font-serif italic font-semibold">
                            host, participate in, and organize{' '}
                        </span>
                        programming contests.
                    </h2>

                <div className="mx-auto grid gap-4 lg:grid-cols-2">
                    <FeatureCard>
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={Trophy}
                                title="Live Leaderboard"
                                description="See how you stack up against other participants in real-time."
                            />
                        </CardHeader>

                        <div className="relative border-t border-dashed max-sm:mb-6">
                            <div className="p-3 px-4">
                                <MockLeaderboard />
                            </div>
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 z-10"
                                style={{
                                    background: 'radial-gradient(125% 125% at 50% 0%, transparent 20%, hsl(var(--muted) / 0.8) 50%, hsl(var(--background)) 85%)'
                                }}
                            />
                        </div>
                    </FeatureCard>

                    <FeatureCard className="flex flex-col">
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={MessageCircle}
                                title="Contest Q&A"
                                description="Get clarifications on problems directly from contest admins."
                            />
                        </CardHeader>

                        <div className="relative flex-1 border-t border-dashed max-sm:mb-6">
                            <div className="flex h-full flex-col p-3 px-4">
                                <MockQA className="flex-1" />
                            </div>
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 z-10"
                                style={{
                                    background: 'radial-gradient(125% 125% at 50% 0%, transparent 25%, hsl(var(--muted) / 0.8) 55%, hsl(var(--background)) 85%)'
                                }}
                            />
                        </div>
                    </FeatureCard>

                        <FeatureCard className="lg:col-span-2 p-12">
                            <p className="text-center text-4xl font-semibold lg:text-7xl">
                                100%{' '}
                                <span className="relative inline-block">
                                    Open Source
                                    <svg
                                        className="absolute -bottom-5 left-0 w-full z-5"
                                        viewBox="0 0 200 12"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        preserveAspectRatio="none"
                                    >
                                        <path
                                            d="M1 5.5C32 2 62 9 95 5.5C128 2 158 8 199 5.5"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <svg
                                        className="absolute -bottom-3 left-0 w-full z-5"
                                        viewBox="0 0 200 12"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        preserveAspectRatio="none"
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
                            <p className="text-center text-muted-foreground mt-4">Self-host your own judge, contribute to the codebase, or fork it entirely</p>
                        </FeatureCard>

                        <FeatureCard className="overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardHeading
                                    icon={Zap}
                                    title="Real-time Feedback"
                                    description="Get instant feedback on your submissions as they run."
                            />
                            </CardHeader>

                            <div className="border-t border-dashed">
                                <div className="p-3 px-4 min-h-[180px]">
                                    <AnimatedExecutionFeed />
                                </div>
                            </div>
                        </FeatureCard>

                        <FeatureCard className="flex flex-col overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardHeading
                                    icon={Activity}
                                    title="Live Submissions"
                                    description="Watch submissions roll in from competitors worldwide."
                            />
                            </CardHeader>

                            <div className="relative flex-1 border-t border-dashed max-sm:mb-6">
                                <div className="flex h-full flex-col p-3 px-4">
                                    <div className="relative h-[240px] overflow-hidden">
                                        <AnimatedSubmissionsList />
                                    </div>
                                </div>
                        </div>
                    </FeatureCard>

                        <FeatureCard className="lg:col-span-2 overflow-hidden px-6 pt-6">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Code2 className="size-4" />
                                <span className="text-sm">Code Editor</span>
                            </div>
                            <p className="text-xl font-semibold mb-4 mt-2">Powered by Monaco's Editor, NextJudge provides syntax highlighting and many themes.</p>
                            <ClippedCodeEditor />
                        </FeatureCard>

                        <FeatureCard className="relative col-span-full overflow-hidden">
                            <div className="absolute z-10 max-w-lg px-6 pr-12 pt-6 md:px-12 md:pt-12">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Activity className="size-4" />
                                    Activity Overview
                                </span>

                                <p className="my-8 text-2xl font-semibold">
                                    Track submission patterns and performance. <span className="text-muted-foreground">See your progress over time.</span>
                                </p>
                            </div>
                            <MockActivityChart />
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
    <Card className={cn('group relative rounded-none shadow-zinc-950/5', className)}>
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
    <div className="p-6">
        <span className="text-muted-foreground flex items-center gap-2">
            <Icon className="size-4" />
            {title}
        </span>
        <p className="mt-8 text-2xl font-semibold">{description}</p>
    </div>
)

type SubmissionStatus = 'ACCEPTED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' | 'PENDING' | 'TIME_LIMIT_EXCEEDED'

interface MockSubmission {
    id: string
    problem: string
    language: string
    status: SubmissionStatus
    time: string
    user: string
}

const languageColors: Record<string, string> = {
    python: 'text-yellow-500 fill-yellow-500',
    javascript: 'text-yellow-400 fill-yellow-400',
    typescript: 'text-blue-500 fill-blue-500',
    java: 'text-red-500 fill-red-500',
    go: 'text-cyan-500 fill-cyan-500',
    rust: 'text-orange-500 fill-orange-500',
    swift: 'text-orange-400 fill-orange-400',
    'c++': 'text-blue-600 fill-blue-600',
}

const statusConfig: Record<SubmissionStatus, { label: string; className: string }> = {
    ACCEPTED: { label: 'Accepted', className: 'bg-emerald-600 text-white' },
    WRONG_ANSWER: { label: 'Wrong Answer', className: 'bg-red-600 text-white' },
    RUNTIME_ERROR: { label: 'Runtime Error', className: 'bg-orange-600 text-white' },
    PENDING: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
    TIME_LIMIT_EXCEEDED: { label: 'TLE', className: 'bg-amber-600 text-white' },
}

const mockSubmissionsData: MockSubmission[] = [
    { id: '1', problem: 'Two Sum', language: 'TypeScript', status: 'ACCEPTED', time: '2s ago', user: 'alice_codes' },
    { id: '2', problem: 'Binary Search', language: 'Rust', status: 'WRONG_ANSWER', time: '5s ago', user: 'bob_dev' },
    { id: '3', problem: 'Merge Sort', language: 'Python', status: 'ACCEPTED', time: '8s ago', user: 'charlie_py' },
    { id: '4', problem: 'N-Queens', language: 'Go', status: 'TIME_LIMIT_EXCEEDED', time: '12s ago', user: 'diana_go' },
    { id: '5', problem: 'Graph Traversal', language: 'Java', status: 'RUNTIME_ERROR', time: '15s ago', user: 'evan_java' },
    { id: '6', problem: 'Dynamic Programming', language: 'C++', status: 'ACCEPTED', time: '18s ago', user: 'fiona_cpp' },
    { id: '7', problem: 'Linked List Cycle', language: 'Swift', status: 'ACCEPTED', time: '22s ago', user: 'george_sw' },
    { id: '8', problem: 'Valid Parentheses', language: 'JavaScript', status: 'WRONG_ANSWER', time: '25s ago', user: 'hannah_js' },
    { id: '9', problem: 'Heap Sort', language: 'Rust', status: 'ACCEPTED', time: '30s ago', user: 'ivan_rust' },
    { id: '10', problem: 'Trie Implementation', language: 'Python', status: 'PENDING', time: '35s ago', user: 'julia_py' },
]

const SubmissionItem = ({ problem, language, status, time, user }: MockSubmission) => {
    const statusInfo = statusConfig[status]
    const langColor = languageColors[language.toLowerCase()] || 'text-muted-foreground'

    return (
        <figure
            className={cn(
                'relative mx-auto min-h-fit w-full cursor-pointer overflow-hidden rounded-xl p-3',
                'transition-all duration-200 ease-in-out hover:scale-[102%]',
                'bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
                'transform-gpu dark:bg-zinc-900/80 dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]'
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-card-foreground truncate">{problem}</span>
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', statusInfo.className)}>
                            {statusInfo.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <CircleDot className={cn('size-2.5', langColor)} />
                            {language}
                        </span>
                        <span>·</span>
                        <span>{time}</span>
                    </div>
                </div>
            </div>
        </figure>
    )
}

const AnimatedSubmissionsList = () => (
    <div className="relative flex h-full w-full flex-col overflow-hidden px-4 py-2">
        <AnimatedList delay={2000}>
            {mockSubmissionsData.map((submission) => (
                <SubmissionItem key={submission.id} {...submission} />
            ))}
        </AnimatedList>
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

const AnimatedExecutionFeed = () => {
    const [steps, setSteps] = useState<ExecutionStep[]>([])
    const [result, setResult] = useState<FinalResult | null>(null)
    const [isRunning, setIsRunning] = useState(false)

    const totalTests = 5

    const runSimulation = useCallback(() => {
        setSteps([])
        setResult(null)
        setIsRunning(true)

        const failAtTest = Math.random() < 0.3 ? Math.floor(Math.random() * totalTests) + 1 : null
        const failType: FinalResult = ['wrong_answer', 'runtime_error', 'time_limit'][Math.floor(Math.random() * 3)] as FinalResult

        setSteps([{ label: 'Compiling...', status: 'running' }])

        setTimeout(() => {
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

                setTimeout(() => {
                    if (failAtTest === currentTest) {
                        setSteps(prev => {
                            const updated = [...prev]
                            updated[updated.length - 1] = {
                                ...updated[updated.length - 1],
                                status: 'error',
                                time: failType === 'time_limit' ? '>1000ms' : getRandomTime()
                            }
                            return updated
                        })
                        setResult(failType)
                        setIsRunning(false)
                        return
                    }

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
                    setTimeout(runNextTest, 400 + Math.random() * 300)
                }, 500 + Math.random() * 400)
            }

            setTimeout(runNextTest, 300)
        }, 600)
    }, [])

    useEffect(() => {
        runSimulation()
    }, [runSimulation])

    const resultConfig: Record<FinalResult, { label: string; className: string }> = {
        success: { label: 'All tests passed!', className: 'bg-emerald-600 text-white' },
        wrong_answer: { label: 'Wrong Answer on test case', className: 'bg-red-600 text-white' },
        runtime_error: { label: 'Runtime Error', className: 'bg-orange-600 text-white' },
        time_limit: { label: 'Time Limit Exceeded', className: 'bg-amber-600 text-white' },
    }

    return (
        <div className="space-y-2 rounded-lg border bg-card p-3 text-xs">
            {steps.map((step, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {step.status === 'completed' && (
                            <CheckCircle className="size-3.5 text-emerald-500" />
                        )}
                        {step.status === 'running' && (
                            <div className="size-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        )}
                        {step.status === 'pending' && (
                            <div className="size-3.5 rounded-full border border-muted-foreground/30" />
                        )}
                        {step.status === 'error' && (
                            <XCircle className="size-3.5 text-red-500" />
                        )}
                        <span className={cn(
                            step.status === 'pending' && 'text-muted-foreground',
                            step.status === 'error' && 'text-red-500'
                        )}>
                            {step.label}
                        </span>
                    </div>
                    {step.time && (
                        <span className={cn(
                            'text-muted-foreground',
                            step.status === 'error' && 'text-red-500'
                        )}>{step.time}</span>
                    )}
                </div>
            ))}

            {result && !isRunning && (
                <div className={cn(
                    'mt-3 rounded-md px-3 py-2 text-center font-medium',
                    resultConfig[result].className
                )}>
                    {resultConfig[result].label}
                </div>
            )}
        </div>
    )
}

const chartData = [
    { value: 30 }, { value: 45 }, { value: 35 }, { value: 60 },
    { value: 40 }, { value: 75 }, { value: 55 }, { value: 80 },
    { value: 65 }, { value: 90 }, { value: 70 }, { value: 85 },
    { value: 95 }, { value: 78 }, { value: 88 }, { value: 72 },
]

const MockActivityChart = () => {
    const maxValue = Math.max(...chartData.map(d => d.value))

    return (
        <div className="h-64 md:h-80 w-full pt-32 md:pt-24">
            <svg
                className="h-full w-full"
                viewBox="0 0 800 200"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="chartGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-2, 220 70% 50%))" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(var(--chart-2, 220 70% 50%))" stopOpacity={0} />
                    </linearGradient>
                </defs>

                {[0, 1, 2, 3].map((i) => (
                    <line
                        key={i}
                        x1="0"
                        y1={50 + i * 50}
                        x2="800"
                        y2={50 + i * 50}
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                ))}

                <path
                    d={`M 0 200 ${chartData.map((d, i) => {
                        const x = (i / (chartData.length - 1)) * 800
                        const y = 200 - (d.value / maxValue) * 150
                        return `L ${x} ${y}`
                    }).join(' ')} L 800 200 Z`}
                    fill="url(#chartGradient)"
                />

                <path
                    d={`M 0 ${200 - (chartData[0].value / maxValue) * 150} ${chartData.map((d, i) => {
                        const x = (i / (chartData.length - 1)) * 800
                        const y = 200 - (d.value / maxValue) * 150
                        return `L ${x} ${y}`
                    }).join(' ')}`}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                />

                <path
                    d={`M 0 200 ${chartData.map((d, i) => {
                        const x = (i / (chartData.length - 1)) * 800
                        const y = 200 - ((d.value * 0.6) / maxValue) * 150
                        return `L ${x} ${y}`
                    }).join(' ')} L 800 200 Z`}
                    fill="url(#chartGradient2)"
                />

                <path
                    d={`M 0 ${200 - ((chartData[0].value * 0.6) / maxValue) * 150} ${chartData.map((d, i) => {
                        const x = (i / (chartData.length - 1)) * 800
                        const y = 200 - ((d.value * 0.6) / maxValue) * 150
                        return `L ${x} ${y}`
                    }).join(' ')}`}
                    fill="none"
                    stroke="hsl(var(--chart-2, 220 70% 50%))"
                    strokeWidth="2"
                    strokeOpacity={0.6}
                />
            </svg>
        </div>
    )
}