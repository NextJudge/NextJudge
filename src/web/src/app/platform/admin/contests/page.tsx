"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { PlusIcon } from "@radix-ui/react-icons";
import { useCallback, useState } from "react";
import { ContestGrid } from "./contest-card";
import { ContestForm } from "./contest-form";

const mockProblems = [
  { title: "Problem 1" },
  { title: "Problem 2" },
  { title: "Problem 3" },
];

const mockComps = [
  {
    startTime: new Date(),
    endTime: new Date(),
    description:
      "The annual programming contest held by the Student ACM Chapter at Oregon State University. Location: Kelley Engineering Center Room 1003.",
    title: "6th Annual ACM@OSU Programming Contest",
    problems: mockProblems,
    participants: [],
  },
];

export default function AdminContestsPage() {
  const [contests, setContests] = useState<any[]>(mockComps);
  const onDelete = useCallback((id: number) => {
    setContests((prev) => prev.filter((contest) => contest.id !== id));
  }, []);
  const onAdd = useCallback((contest: any) => {
    setContests((prev) => [...prev, contest]);
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Contest Management</h3>
          <p className="text-sm text-muted-foreground">
            The hub of all the NextJudge contests. Create, edit, and delete
            contests here.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <div>
              <Button variant="outline" className="flex items-center space-x-4">
                <PlusIcon /> <span>Create contest</span>
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] lg:max-w-[640px] overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Create a new contest</DialogTitle>
              <DialogDescription>
                Fill in the details of the contest you want to create.
              </DialogDescription>
            </DialogHeader>
            <ContestForm onAdd={onAdd} />
          </DialogContent>
        </Dialog>
      </div>
      <Separator />
      <ContestGrid contests={contests} onDelete={onDelete} />
      <Toaster />
    </div>
  );
}
