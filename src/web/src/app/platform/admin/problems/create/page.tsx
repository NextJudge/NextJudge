"use client";

import KatexSpan from "@/components/katex-wrapper";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import "katex/dist/katex.min.css";
import { useRouter } from "next/navigation";
import { useState } from "react";

const quadraticEquationTest = `Given a general quadratic equation of the form
$$ax^{2} + bx + c = 0$$
with $x$ representing an unknown, with $a$, $b$ and $c$ representing constants, and with $a \\ne 0$, the quadratic formula is:
$$x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}$$`;

export default function AdminProblemsPage() {
  const router = useRouter();
  const [problemDesc, setProblemDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const onClick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Problem saved successfully",
        description: "The problem has been saved successfully.",
      });
      router.push("/platform/admin/problems");
    }, 1000);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Create a new problem</h3>
            <p className="text-sm text-muted-foreground">
              Write your problem in latex format. The specific format is given
              in this link{" "}
              <a
                href="https://icpc.io/problem-package-format/spec/problem_package_format"
                target="_blank"
                className="text-osu"
              >
                here.
              </a>
            </p>
          </div>
        </div>
        <Separator />
        <div className="max-w-5xl">
          <h1>
            An Example:{" "}
            <a
              href="https://en.wikipedia.org/wiki/Quadratic_equation"
              target="_blank"
              className="text-osu"
            >
              The Quadratic Equation
            </a>
          </h1>
          <KatexSpan text={quadraticEquationTest} className="my-20 text-xl" />
          <KatexSpan text={problemDesc} className="my-20 text-xl" />
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="message">Input the problem</Label>
          <Textarea
            className="min-h-[20rem]"
            placeholder={quadraticEquationTest}
            value={problemDesc}
            onChange={(e) => setProblemDesc(e.target.value)}
            id="message"
          />
        </div>
        <LoadingButton loading={loading} onClick={onClick}>
          Create problem
        </LoadingButton>
      </div>
      <Toaster />
    </>
  );
}
