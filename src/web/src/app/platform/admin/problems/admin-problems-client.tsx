"use client";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { apiGetCategories, apiGetProblems } from "@/lib/api";
import { Category, Problem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createColumns } from "../../problems/components/columns";
import { DataTable } from "../../problems/components/data-table";

export default function AdminProblemsClient() {
    const { data: session } = useSession();
    const [problems, setProblems] = useState<Problem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const isAdmin = session?.user?.is_admin ?? false;

    const fetchData = useCallback(async () => {
        if (!session?.nextjudge_token) return;

        try {
            const [problemsData, categoriesData] = await Promise.all([
                apiGetProblems(session.nextjudge_token),
                apiGetCategories(session.nextjudge_token)
            ]);
            setProblems(problemsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, [session?.nextjudge_token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = useCallback(() => {
        fetchData();
    }, [fetchData]);

    const columns = createColumns(handleUpdate, isAdmin);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <h3 className="text-lg font-medium">Problem Set</h3>
                        <p className="text-sm text-muted-foreground">
                            Loading problems...
                        </p>
                    </div>
                </div>
                <Separator />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h3 className="text-lg font-medium">Problem Set</h3>
                    <p className="text-sm text-muted-foreground">
                        As an admin, you can manage the problems in the official NextJudge
                        problem set.
                    </p>
                </div>
                <Link
                    className={cn(`text-white ${buttonVariants({ variant: "outline" })}`)}
                    href="/platform/admin/problems/create"
                >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Problem
                </Link>
            </div>
            <Separator />
            <DataTable columns={columns} data={problems} />
            <Toaster />
        </div>
    );
}
