"use client";

import "@/app/globals.css";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";
import { useContext } from "react";
import CodeEditor from "./code-editor";
import markdownFile from "@/md/twosum.md";
import { EditorSkeleton } from "@/components/editor-skeleton";
import { useEditorCollapse } from "@/hooks/useEditorCollapse";
import { useEditorTheme } from "@/hooks/useEditorTheme";
import { useThemesLoader } from "@/hooks/useThemeLoader";
import { ThemeContext } from "@/providers/editor-theme";
import { Theme } from "@/types";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import MarkdownRenderer from "./markdown-renderer";

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
  const { resolvedTheme } = useTheme();
  const defaultColorScheme =
    resolvedTheme === "dark" ? darkDefault : lightDefault;
  const { setTheme } = useContext(ThemeContext);
  const { themes, loading } = useThemesLoader();
  const { onSelect } = useEditorTheme(resolvedTheme, defaultColorScheme);

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
            className={cn("min-h-[calc(100vh-4rem)] w-full")}
            style={{ overflow: "auto" }}
            ref={ref}
            collapsible
            minSize={10}
            onCollapse={collapse}
          >
            <div className="overflow-auto">
              <div className=" p-4 overflow-auto">
                <div className="flex flex-col min-w-72 max-w-2xl gap-1">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Problem Statement</h1>
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
                  {!loading && <CodeEditor themes={themes} />}
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
