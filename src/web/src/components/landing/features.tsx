import { Card, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CheckCircle, HelpCircle, LucideIcon, MessageCircle, Trophy } from 'lucide-react'
import { ReactNode } from 'react'

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
        <section className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="mx-auto max-w-2xl px-6 lg:max-w-5xl">
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

                    <FeatureCard className="p-6 lg:col-span-2">
                        <p className="mx-auto my-6 max-w-md text-balance text-center text-2xl font-semibold">Smart scheduling with automated reminders for maintenance.</p>

                        <div className="flex justify-center gap-6 overflow-hidden">
                            <CircularUI
                                label="Inclusion"
                                circles={[{ pattern: 'border' }, { pattern: 'border' }]}
                            />

                            <CircularUI
                                label="Inclusion"
                                circles={[{ pattern: 'none' }, { pattern: 'primary' }]}
                            />

                            <CircularUI
                                label="Join"
                                circles={[{ pattern: 'blue' }, { pattern: 'none' }]}
                            />

                            <CircularUI
                                label="Exclusion"
                                circles={[{ pattern: 'primary' }, { pattern: 'none' }]}
                                className="hidden sm:block"
                            />
                        </div>
                    </FeatureCard>
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

interface CircleConfig {
    pattern: 'none' | 'border' | 'primary' | 'blue'
}

interface CircularUIProps {
    label: string
    circles: CircleConfig[]
    className?: string
}

const CircularUI = ({ label, circles, className }: CircularUIProps) => (
    <div className={className}>
        <div className="bg-linear-to-b from-border size-fit rounded-2xl to-transparent p-px">
            <div className="bg-linear-to-b from-background to-muted/25 relative flex aspect-square w-fit items-center -space-x-4 rounded-[15px] p-4">
                {circles.map((circle, i) => (
                    <div
                        key={i}
                        className={cn('size-7 rounded-full border sm:size-8', {
                            'border-primary': circle.pattern === 'none',
                            'border-primary bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_4px)]': circle.pattern === 'border',
                            'border-primary bg-background bg-[repeating-linear-gradient(-45deg,var(--color-primary),var(--color-primary)_1px,transparent_1px,transparent_4px)]': circle.pattern === 'primary',
                            'bg-background z-1 border-blue-500 bg-[repeating-linear-gradient(-45deg,var(--color-blue-500),var(--color-blue-500)_1px,transparent_1px,transparent_4px)]': circle.pattern === 'blue',
                        })}></div>
                ))}
            </div>
        </div>
        <span className="text-muted-foreground mt-1.5 block text-center text-sm">{label}</span>
    </div>
)