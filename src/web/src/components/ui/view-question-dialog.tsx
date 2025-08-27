"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EventQuestion } from "@/lib/types"
import { format } from "date-fns"

interface ViewQuestionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    question: EventQuestion | null
}

export function ViewQuestionDialog({
    open,
    onOpenChange,
    question
}: ViewQuestionDialogProps) {
    if (!question) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Question & Answer</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{question.user?.name || "Anonymous"}</span>
                                {question.problem && (
                                    <Badge variant="secondary" className="text-xs">
                                        {question.problem.title}
                                    </Badge>
                                )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {format(new Date(question.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">Question:</h3>
                            <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm whitespace-pre-wrap">{question.question}</p>
                            </div>
                        </div>
                    </div>

                    {question.is_answered && question.answer && (
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="default">Answered</Badge>
                                    {question.answerer && (
                                        <span className="text-sm font-medium">by {question.answerer.name}</span>
                                    )}
                                </div>
                                {question.answered_at && (
                                    <span className="text-sm text-muted-foreground">
                                        {format(new Date(question.answered_at), "MMM d, yyyy 'at' h:mm a")}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm">Answer:</h3>
                                <div className="p-3 bg-muted rounded-md">
                                    <p className="text-sm whitespace-pre-wrap">{question.answer}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
