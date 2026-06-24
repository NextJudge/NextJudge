"use client"

import { Icons } from "@/components/icons"
import { AnswerQuestionDialog } from "@/components/ui/answer-question-dialog"
import { AskQuestionDialog } from "@/components/ui/ask-question-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ViewQuestionDialog } from "@/components/ui/view-question-dialog"
import { apiGetEventQuestions } from "@/lib/api"
import { EventQuestion, Problem } from "@/lib/types"
import { format } from "date-fns"
import { CheckCircle, MessageCircleQuestion } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

interface QuestionsSectionProps {
    eventId: number
    problems: Problem[]
    isAdmin: boolean
}

const QuestionRow = ({
    question,
    showActions,
    onView,
    onAnswer,
}: {
    question: EventQuestion
    showActions: boolean
    onView: (question: EventQuestion) => void
    onAnswer: (question: EventQuestion) => void
}) => (
    <div className={`grid gap-4 items-start py-3 border-b ${showActions ? "grid-cols-5" : "grid-cols-4"}`}>
        <div className="text-sm">
            <div className="font-medium">{question.user?.name || "Anonymous"}</div>
            {question.problem && (
                <Badge variant="secondary" className="mt-1 text-xs">
                    {question.problem.title}
                </Badge>
            )}
        </div>
        <div className="text-sm text-muted-foreground">
            {format(new Date(question.created_at), "MMM d, h:mm a")}
        </div>
        <div className="text-sm">
            <p className="line-clamp-3">{question.question}</p>
        </div>
        <div className="text-sm">
            {question.is_answered ? (
                <Badge
                    variant="default"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onView(question)}
                >
                    Answered <CheckCircle className="w-4 h-4 ml-1" />
                </Badge>
            ) : (
                <Badge variant="outline">Pending</Badge>
            )}
        </div>
        {showActions && (
            <div className="text-sm">
                <Button size="sm" variant="ghost" onClick={() => onAnswer(question)}>
                    Answer
                </Button>
            </div>
        )}
    </div>
)

const QuestionTableHeader = ({ showActions }: { showActions: boolean }) => (
    <div className={`grid gap-4 text-sm font-medium border-b pb-2 ${showActions ? "grid-cols-5" : "grid-cols-4"}`}>
        <div>Party</div>
        <div>Date & Time</div>
        <div>Question</div>
        <div>Status</div>
        {showActions && <div>Actions</div>}
    </div>
)

export function QuestionsSection({ eventId, problems, isAdmin }: QuestionsSectionProps) {
    const { data: session } = useSession()
    const [questions, setQuestions] = useState<EventQuestion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [askDialogOpen, setAskDialogOpen] = useState(false)
    const [answerDialogOpen, setAnswerDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedQuestion, setSelectedQuestion] = useState<EventQuestion | null>(null)

    const currentUserId = session?.nextjudge_id

    useEffect(() => {
        fetchQuestions()
    }, [eventId, session?.nextjudge_token])

    const fetchQuestions = async () => {
        if (!session?.nextjudge_token) return

        setIsLoading(true)
        try {
            const questionsData = await apiGetEventQuestions(session.nextjudge_token, eventId)
            setQuestions(questionsData)
        } catch (error) {
            console.error("Error fetching questions:", error)
            toast.error("Failed to load questions")
        } finally {
            setIsLoading(false)
        }
    }

    const publicClarifications = useMemo(
        () => questions.filter((question) => question.is_answered),
        [questions],
    )

    const myPendingQuestions = useMemo(
        () =>
            questions.filter(
                (question) => !question.is_answered && question.user_id === currentUserId,
            ),
        [questions, currentUserId],
    )

    const adminPendingQuestions = useMemo(
        () => (isAdmin ? questions.filter((question) => !question.is_answered) : []),
        [questions, isAdmin],
    )

    const visibleQuestions = useMemo(() => {
        if (isAdmin) {
            return questions
        }
        return [...publicClarifications, ...myPendingQuestions]
    }, [isAdmin, questions, publicClarifications, myPendingQuestions])

    const handleQuestionCreated = () => {
        fetchQuestions()
    }

    const handleQuestionAnswered = () => {
        fetchQuestions()
        setSelectedQuestion(null)
    }

    const handleAnswerClick = (question: EventQuestion) => {
        setSelectedQuestion(question)
        setAnswerDialogOpen(true)
    }

    const handleViewClick = (question: EventQuestion) => {
        setSelectedQuestion(question)
        setViewDialogOpen(true)
    }

    const showAdminActions = isAdmin || questions.some((question) => question.user?.is_admin)

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Questions
                            </CardTitle>
                            <p className="text-xs text-muted-foreground/70">
                                Ask a question about a problem
                            </p>
                        </div>
                        <Button
                            onClick={() => setAskDialogOpen(true)}
                            className="gap-2"
                            variant="link"
                            disabled={!session?.nextjudge_token}
                            size="sm"
                        >
                            <Icons.help className="w-3 h-3" />
                            <span className="hidden sm:inline">Ask</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="rounded-full bg-muted/50 p-3 mb-3">
                                <MessageCircleQuestion className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">No questions yet</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                Need clarification on a problem? Ask a question and staff will respond
                                with a public clarification when answered.
                            </p>
                            <Button
                                onClick={() => setAskDialogOpen(true)}
                                className="mt-4 gap-2"
                                size="sm"
                                disabled={!session?.nextjudge_token}
                            >
                                <Icons.help className="w-3 h-3" />
                                Ask the first question
                            </Button>
                        </div>
                    ) : visibleQuestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <p className="text-sm font-medium text-foreground">No visible questions</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                Pending questions from other participants are private until answered.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {publicClarifications.length > 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium">Public clarifications</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Answered questions visible to all participants
                                        </p>
                                    </div>
                                    <QuestionTableHeader showActions={false} />
                                    {publicClarifications.map((question) => (
                                        <QuestionRow
                                            key={question.id}
                                            question={question}
                                            showActions={false}
                                            onView={handleViewClick}
                                            onAnswer={handleAnswerClick}
                                        />
                                    ))}
                                </div>
                            )}

                            {isAdmin && adminPendingQuestions.length > 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium">Pending review</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Questions waiting for a staff response
                                        </p>
                                    </div>
                                    <QuestionTableHeader showActions={showAdminActions} />
                                    {adminPendingQuestions.map((question) => (
                                        <QuestionRow
                                            key={question.id}
                                            question={question}
                                            showActions={showAdminActions}
                                            onView={handleViewClick}
                                            onAnswer={handleAnswerClick}
                                        />
                                    ))}
                                </div>
                            )}

                            {!isAdmin && myPendingQuestions.length > 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium">Your pending questions</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Only you can see these until they are answered
                                        </p>
                                    </div>
                                    <QuestionTableHeader showActions={false} />
                                    {myPendingQuestions.map((question) => (
                                        <QuestionRow
                                            key={question.id}
                                            question={question}
                                            showActions={false}
                                            onView={handleViewClick}
                                            onAnswer={handleAnswerClick}
                                        />
                                    ))}
                                </div>
                            )}

                            {publicClarifications.length === 0 &&
                                (isAdmin ? adminPendingQuestions.length === 0 : myPendingQuestions.length === 0) && (
                                    <div className="text-center text-muted-foreground py-6 text-sm">
                                        No clarifications published yet.
                                    </div>
                                )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AskQuestionDialog
                open={askDialogOpen}
                onOpenChange={setAskDialogOpen}
                eventId={eventId}
                problems={problems}
                onQuestionCreated={handleQuestionCreated}
            />

            <AnswerQuestionDialog
                open={answerDialogOpen}
                onOpenChange={setAnswerDialogOpen}
                eventId={eventId}
                question={selectedQuestion}
                onQuestionAnswered={handleQuestionAnswered}
            />

            <ViewQuestionDialog
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                question={selectedQuestion}
            />
        </div>
    )
}
