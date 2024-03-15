"use client";

import "@/app/globals.css";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { loader } from "@monaco-editor/react";
import "katex/dist/katex.min.css";
import { useTheme } from "next-themes";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useCollapse } from "react-collapsed";
import { ImperativePanelHandle } from "react-resizable-panels";
import CodeEditor from "./code-editor";

import { EditorSkeleton } from "@/components/editor-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const problemStatement = `
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
`;

// const BRIDGE_ENDPOINT = `http://localhost:8080/api/v1`;
export default function EditorComponent({
  themes,
  onSelect,
  selectedTheme,
  isThemeLoaded,
  setIsThemeLoaded,
}: any) {
  const editorRef = useRef<any>();
  const [languages, setLanguages] = useState<any>([]);
  const [isExpanded, setExpanded] = useState(true);
  const [submissionId, setSubmissionId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const ref = useRef<ImperativePanelHandle>(null);
  const { getCollapseProps, getToggleProps } = useCollapse({ isExpanded });
  const [submissionStatus, setSubmissionStatus] = useState("Loading");
  const supportedLanguages = [
    { language: "C++", extension: "cpp" },
    { language: "Python", extension: "py" },
    { language: "Go", extension: "go" },
    { language: "Java", extension: "java" },
    { language: "Node", extension: "ts" },
  ];

  const { theme } = useTheme();
  useLayoutEffect(() => {
    loader.init().then((monaco) => {
      setLoading(false);
    });
  }, []);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  const collapse = useCallback(() => {
    if (ref.current) {
      ref.current.collapse();
      setIsCollapsed(true);
    }
  }, [ref]);

  const expand = useCallback(() => {
    if (ref.current) {
      ref.current.expand();
      setIsCollapsed(false);
    }
  }, [ref]);

  return (
    <TooltipProvider delayDuration={0}>
      <div>
        <ResizablePanelGroup
          direction="horizontal"
          className={cn(
            "relative max-w-screen rounded-lg border max-h-screen w-full"
          )}
        >
          {/* Problem Statement Section */}
          <ResizablePanel
            defaultSize={25}
            className={cn("min-h-[calc(100vh-4rem)] w-full", {
              "transition-all duration-100": !isCollapsed,
              "transition-all duration-75": isCollapsed,
            })}
            style={{ overflow: "auto" }}
            ref={ref}
            collapsible
            minSize={10}
            onCollapse={collapse}
          >
            <div className="overflow-auto">
              <div className=" p-4 overflow-auto">
                <div className="flex flex-col min-w-72 max-w-full gap-1">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Problem Statement</h1>
                  </div>
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col">
                      <p className="text-lg">{problemStatement}</p>
                    </div>
                  </div>
                  <div>{/* Render Latex */}</div>
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
                  className={cn({
                    "transform translate-x-2 z-50": isCollapsed,
                  })}
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
            <ResizablePanelGroup direction="vertical" className="h-full w-full">
              <ResizablePanel
                defaultSize={80}
                minSize={40}
                className="min-w-full"
              >
                <div className="flex w-full h-full items-center justify-center overflow-y-scroll">
                  {loading && <EditorSkeleton />}
                  {!loading && (
                    <CodeEditor
                      themes={themes}
                      onSelect={onSelect}
                      selectedTheme={selectedTheme}
                      isThemeLoaded={isThemeLoaded}
                      setIsThemeLoaded={setIsThemeLoaded}
                    />
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={10}>
                <div className="flex h-full items-center justify-center p-6">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold">Submission Status</h3>
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
