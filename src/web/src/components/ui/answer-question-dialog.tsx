"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiAnswerEventQuestion } from "@/lib/api"
import { AnswerQuestionRequest, EventQuestion } from "@/lib/types"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { toast } from "sonner"

interface AnswerQuestionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    eventId: number
    question: EventQuestion | null
    onQuestionAnswered?: () => void
}

export function AnswerQuestionDialog({
    open,
    onOpenChange,
    eventId,
    question,
    onQuestionAnswered
}: AnswerQuestionDialogProps) {
    const { data: session } = useSession()
    const [answer, setAnswer] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!session?.nextjudge_token || !question) {
            toast.error("Invalid session or question")
            return
        }

        if (!answer.trim()) {
            toast.error("Please enter an answer")
            return
        }

        setIsSubmitting(true)

        try {
            const answerData: AnswerQuestionRequest = {
                answer: answer.trim()
            }

            await apiAnswerEventQuestion(session.nextjudge_token, eventId, question.id, answerData)

            toast.success("Question answered successfully")
            setAnswer("")
            onOpenChange(false)
            onQuestionAnswered?.()
        } catch (error) {
            console.error("Error answering question:", error)
            toast.error("Failed to answer question")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Answer Question</DialogTitle>
                </DialogHeader>
                {question && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Question from {question.user?.name}</Label>
                            <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm">{question.question}</p>
                                {question.problem && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Related to: {question.problem.title}
                                    </p>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="answer">Your Answer</Label>
                                <Textarea
                                    id="answer"
                                    placeholder="Provide a helpful answer..."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Submitting..." : "Submit Answer"}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
