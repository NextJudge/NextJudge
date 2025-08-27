"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiCreateEventQuestion } from "@/lib/api"
import { CreateQuestionRequest, Problem } from "@/lib/types"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { toast } from "sonner"

interface AskQuestionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    eventId: number
    problems: Problem[]
    onQuestionCreated?: () => void
}

export function AskQuestionDialog({
    open,
    onOpenChange,
    eventId,
    problems,
    onQuestionCreated
}: AskQuestionDialogProps) {
    const { data: session } = useSession()
    const [question, setQuestion] = useState("")
    const [problemId, setProblemId] = useState<string>("general")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!session?.nextjudge_token) {
            toast.error("You must be logged in to ask a question")
            return
        }

        if (!question.trim()) {
            toast.error("Please enter a question")
            return
        }

        setIsSubmitting(true)

        try {
            const questionData: CreateQuestionRequest = {
                question: question.trim(),
                problem_id: problemId && problemId !== "general" ? parseInt(problemId) : undefined
            }

            await apiCreateEventQuestion(session.nextjudge_token, eventId, questionData)

            toast.success("Question submitted successfully")
            setQuestion("")
            setProblemId("general")
            onOpenChange(false)
            onQuestionCreated?.()
        } catch (error) {
            console.error("Error creating question:", error)
            toast.error("Failed to submit question")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Ask a Question</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="problem">Problem (Optional)</Label>
                        <Select value={problemId} onValueChange={setProblemId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a problem or leave blank for general question" />
                            </SelectTrigger>
                                                         <SelectContent>
                                 <SelectItem value="general">General question</SelectItem>
                                 {problems.map((problem) => (
                                     <SelectItem key={problem.id} value={problem.id.toString()}>
                                         {problem.title}
                                     </SelectItem>
                                 ))}
                             </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="question">Question</Label>
                        <Textarea
                            id="question"
                            placeholder="Describe your question in detail..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
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
                            {isSubmitting ? "Submitting..." : "Submit Question"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
