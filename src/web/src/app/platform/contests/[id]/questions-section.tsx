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
import { CheckCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface QuestionsSectionProps {
    eventId: number
    problems: Problem[]
    isAdmin: boolean
}

export function QuestionsSection({ eventId, problems, isAdmin }: QuestionsSectionProps) {
    const { data: session } = useSession()
    const [questions, setQuestions] = useState<EventQuestion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [askDialogOpen, setAskDialogOpen] = useState(false)
    const [answerDialogOpen, setAnswerDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedQuestion, setSelectedQuestion] = useState<EventQuestion | null>(null)

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

    return (
        <div className="space-y-4">
            <div>
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Questions</CardTitle>
                                <p className="text-xs text-muted-foreground/70">
                                    Ask a question about a problem
                                </p>
                            </div>
                            <Button
                                onClick={() => setAskDialogOpen(true)}
                                className="gap-2"
                                variant={"link"}
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
                            <div className="text-center text-muted-foreground py-8">
                                Loading questions...
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                No questions yet
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className={`grid gap-4 text-sm font-medium border-b pb-2 ${(isAdmin || questions.some(q => q.user?.is_admin)) ? 'grid-cols-5' : 'grid-cols-4'}`}>
                                    <div>Party</div>
                                    <div>Date & Time</div>
                                    <div>Question</div>
                                    <div>Status</div>
                                    {(isAdmin || questions.some(q => q.user?.is_admin)) && <div>Actions</div>}
                                </div>
                                {questions.map((question) => (
                                    <div key={question.id} className={`grid gap-4 items-start py-3 border-b ${(isAdmin || questions.some(q => q.user?.is_admin)) ? 'grid-cols-5' : 'grid-cols-4'}`}>
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
                                                    onClick={() => handleViewClick(question)}
                                                >
                                                    Answered <CheckCircle className="w-4 h-4 ml-1" />
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                        {(isAdmin || (!isAdmin && question.user?.is_admin)) && (
                                            <div className="text-sm">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleAnswerClick(question)}
                                                >
                                                    Answer
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

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
