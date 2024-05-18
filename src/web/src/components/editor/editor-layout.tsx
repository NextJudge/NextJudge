"use client";

import "@/app/globals.css";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RecentSubmissionCard } from "@/app/platform/problems/components/recent-submissions";
import { recentSubmissions } from "@/app/platform/problems/data/data";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useEditorCollapse } from "@/hooks/useEditorCollapse";
import { useEditorTheme } from "@/hooks/useEditorTheme";
import { useThemesLoader } from "@/hooks/useThemeLoader";
import { cn } from "@/lib/utils";
import markdownFile from "@/md/twosum.md";
import { ThemeContext } from "@/providers/editor-theme";
import { Theme } from "@/types";
import "katex/dist/katex.min.css";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { Icons } from "../icons";
import MarkdownRenderer from "../markdown-renderer";
import { Expected, Input as InputCase, Output } from "../submit-box";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import CodeEditor from "./code-editor";

const problemStatement = `
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
`;

const darkDefault: Theme = {
  name: "brilliance-black",
  fetch: "/themes/Brilliance Black.json",
};
const lightDefault: Theme = {
  name: "github-light",
  fetch: "/themes/GitHub Light.json".replace(" ", "%20"),
};

// const BRIDGE_ENDPOINT = `http://localhost:8080/api/v1`;
export default function EditorComponent({}: any) {
  const { isCollapsed, ref, collapse, expand } = useEditorCollapse();
  const {
    isCollapsed: isCollapsed2,
    ref: ref2,
    collapse: collapse2,
    expand: expand2,
  } = useEditorCollapse();
  const { resolvedTheme } = useTheme();
  const defaultColorScheme =
    resolvedTheme === "dark" ? darkDefault : lightDefault;
  const { setTheme } = useContext(ThemeContext);
  const { themes, loading } = useThemesLoader();
  const { onSelect } = useEditorTheme(resolvedTheme, defaultColorScheme);
  const [runtime, setRuntime] = useState(40);
  const [input, setInput] = useState("[2, 7, 11, 15], 9");
  const [output, setOutput] = useState("[0, 1]");
  const [expected, setExpected] = useState("[0, 1]");
  const router = useRouter();

  return (
    <TooltipProvider delayDuration={0}>
      <div>
        <ResizablePanelGroup
          direction="horizontal"
          className={cn(
            "relative max-w-screen rounded-lg border max-h-[calc(100vh-3.55rem)]  w-full"
          )}
        >
          {/* Problem Statement Section */}
          <ResizablePanel
            defaultSize={25}
            className={cn("w-full")}
            style={{ overflow: "auto" }}
            ref={ref}
            collapsible
            minSize={10}
            onCollapse={collapse}
          >
            <div>
              <div className=" p-4 overflow-auto">
                <div className="flex flex-col min-w-56 max-w-2xl gap-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Problem Statement</h1>
                    <Badge variant="secondary" className="text-xs">
                      Easy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-start gap-2">
                    <div className="text-xs text-accent-foreground">
                      <span>Tags:</span>
                    </div>
                    {[`Array`, `Hash Table`, `Two Pointers`].map((tag) => (
                      <Badge
                        variant="outline"
                        onClick={() =>
                          router.push(`/platform/problems?tag=${tag}`)
                        }
                        className={cn(
                          "text-xs",
                          "bg-accent-background",
                          "text-accent-foreground",
                          "hover:underline",
                          "hover:cursor-pointer"
                        )}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <MarkdownRenderer markdown={markdownFile} />
                </div>
              </div>
            </div>
            {/* Collapsed */}
          </ResizablePanel>
          <div className="flex flex-col dark:border-r border-r dark:border-neutral-800 items-center justify-center border-secondary-muted">
            <Tooltip>
              <TooltipTrigger>
                <ResizableHandle
                  withHandle
                  className={cn(
                    {
                      "transform translate-x-2 z-50": isCollapsed,
                    },
                    "cursor-col-resize"
                  )}
                  onClickCapture={() => {
                    if (isCollapsed) {
                      expand();
                    } else {
                      collapse();
                    }
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Resize</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <ResizablePanel
            defaultSize={75}
            className="w-[70dvw] max-w-screen-2xl"
          >
            <ResizablePanelGroup direction="vertical" className="w-full">
              {/*  Code Editor Section */}
              <ResizablePanel
                defaultSize={80}
                minSize={40}
                className="min-w-full"
              >
                <div className="flex w-full h-full items-center justify-center overflow-y-scroll">
                  {loading && <EditorSkeleton />}
                  {!loading && <CodeEditor themes={themes} />}
                </div>
              </ResizablePanel>
              <Tooltip>
                <TooltipTrigger>
                  <ResizableHandle
                    withHandle
                    className={cn(
                      {
                        "transform translate-x-2 z-50 mb-2": isCollapsed2,
                      },
                      "cursor-row-resize"
                    )}
                    onClickCapture={() => {
                      if (isCollapsed2) {
                        expand2();
                      } else {
                        collapse2();
                      }
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent sideOffset={10}>
                  <p>Resize</p>
                </TooltipContent>
              </Tooltip>
              {/* Submission Section */}
              <ResizablePanel
                defaultSize={0}
                style={{
                  overflow: "auto",
                }}
                minSize={10}
                collapsible
                onCollapse={collapse2}
                ref={ref2}
                collapsedSize={0}
                className="backdrop-filter backdrop-blur-3xl"
              >
                <div className="mx-5 my-4 space-y-4 h-100 overflow-auto">
                  <div className="flex items-center">
                    <div className="text-xl font-semibold text-red-600 dark:text-dark-red-800">
                      Not Accepted
                    </div>
                    <div className="ml-4 text-sm text-accent-foreground">
                      Runtime: 36 ms
                    </div>
                    <div className="ml-auto flex min-w-0 items-center space-x-4">
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button
                            variant="outline"
                            className="scale-75 flex gap-2"
                          >
                            <Icons.eye className="w-4 h-4" />
                            <span>View Submissions</span>
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <DrawerHeader>
                            <DrawerTitle>Your Submissions</DrawerTitle>
                            <DrawerDescription>
                              See your submissions to both this problem and this
                              category.
                            </DrawerDescription>
                          </DrawerHeader>

                          <div className="mx-6 flex flex-col gap-4">
                            <Tabs
                              defaultValue="problem"
                              className={cn("w-full max-h-96")}
                            >
                              <TabsList>
                                <TabsTrigger value="problem">
                                  Problem
                                </TabsTrigger>
                                <TabsTrigger value="category">
                                  Category
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="problem">
                                <ul className="grid grid-flow-row grid-cols-3 gap-4">
                                  {recentSubmissions.map((submission) => (
                                    <RecentSubmissionCard
                                      submission={submission}
                                      key={submission.id}
                                    />
                                  ))}
                                </ul>
                              </TabsContent>
                              <TabsContent value="category">
                                <ul className="grid grid-flow-row grid-cols-3 gap-4">
                                  {recentSubmissions.map((submission) => (
                                    <RecentSubmissionCard
                                      submission={submission}
                                      key={submission.id}
                                    />
                                  ))}
                                </ul>
                              </TabsContent>
                            </Tabs>
                          </div>
                          <DrawerFooter className={cn("mt-4 w-full")}>
                            <DrawerClose>
                              <Button className="w-full" variant="outline">
                                Done
                              </Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-4">
                    <Tabs defaultValue="case-2" className={cn("w-full")}>
                      <TabsList>
                        <TabsTrigger value="case-1">Case 1</TabsTrigger>
                        <TabsTrigger value="case-2">Case 2</TabsTrigger>
                      </TabsList>
                      <TabsContent value="case-1">
                        <div className="space-y-4">
                          <InputCase />
                          <Expected />
                          <Output />
                        </div>
                        <div className="mx-auto flex items-center justify-center mt-3 ">
                          <button className="group cursor-pointer relative shadow-2xl rounded-full p-px text-xs font-semibold leading-6 inline-block">
                            <span className="absolute inset-0 overflow-hidden rounded-full">
                              <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(255,89,28,0.1)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            </span>
                            <div className="relative flex space-x-2 items-center z-10 rounded-full py-0.5 px-4 ring-1 ring-orange-400/10 ">
                              <span>Help make NextJudge better!</span>
                              <svg
                                fill="none"
                                height="16"
                                viewBox="0 0 24 24"
                                width="16"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10.75 8.75L14.25 12L10.75 15.25"
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1.5"
                                />
                              </svg>
                            </div>
                            <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-orange-400/0 via-orange-800/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40" />
                          </button>
                        </div>
                      </TabsContent>
                      <TabsContent value="case-2">
                        <div className="space-y-4">
                          <InputCase />
                          <Expected />
                          <Output />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
