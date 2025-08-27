import { auth } from "@/app/auth";
import { EditProblemForm } from "@/components/forms/edit-problem-form";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { apiGetCategories, apiGetProblem } from "@/lib/api";
import "katex/dist/katex.min.css";
import { notFound } from "next/navigation";

interface EditProblemPageProps {
    params: { id: string };
}

export default async function EditProblemPage({ params }: EditProblemPageProps) {
    const session = await auth();

    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const problemId = parseInt(params.id);
    if (isNaN(problemId)) {
        notFound();
    }

    try {
        const [categories, problem] = await Promise.all([
            apiGetCategories(session.nextjudge_token),
            apiGetProblem(session.nextjudge_token, problemId)
        ]);

        if (!problem) {
            notFound();
        }

        return (
            <>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="text-lg font-medium">
                                Edit Problem: {problem.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Update the problem details below.
                            </p>
                        </div>
                    </div>
                    <Separator />
                    <div className="max-w-5xl">
                        <EditProblemForm
                            categories={categories}
                            problem={problem}
                            problemId={problemId}
                        />
                    </div>

                    <Toaster />
                </div>
            </>
        );
    } catch (error) {
        console.error("Error loading problem:", error);
        notFound();
    }
}
