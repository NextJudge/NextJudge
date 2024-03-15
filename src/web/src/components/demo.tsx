"use client";

import "@/app/globals.css";
import { EditorSkeleton } from "@/components/editor-skeleton";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Editor, { loader } from "@monaco-editor/react";
import { AnimatePresence, motion } from "framer-motion";
import "katex/dist/katex.min.css";
import { useTheme } from "next-themes";
import { useLayoutEffect, useRef, useState } from "react";
import { useCollapse } from "react-collapsed";
import { Button } from "./ui/button";

const problemStatement = `
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
`;

// const BRIDGE_ENDPOINT = `http://localhost:8080/api/v1`;
export default function EditorComponent() {
  const [code, setCode] = useState(`// Write your code below
const twoSum = (nums: number[], target: number) => {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) return [map.get(complement), i];
        map.set(nums[i], i);
    }
};
    `);
  const editorRef = useRef<any>();
  const [languages, setLanguages] = useState<any>([]);
  const [isExpanded, setExpanded] = useState(true);
  const [submissionId, setSubmissionId] = useState(0);
  const [loading, setLoading] = useState(true); // State to track loading status

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
      monaco.editor.defineTheme("myTheme", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#1e1e1e",
        },
      });
      setLoading(false); // Set loading state to false after initialization
    });
  }, []);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  const handleCodeChange = (ev: any) => {
    setCode(ev.target.value);
  };

  return (
    <div className="w-full min-h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel maxSize={40} defaultSize={30}>
          {/* problem details */}
          <div className="w-full h-full p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Problem Statement</h1>
              <div className="flex items-center space-x-4">
                <button className="btn btn-primary">Submit</button>
                <button className="btn btn-secondary">Reset</button>
              </div>
            </div>
            <div className="prose">
              <p>{problemStatement}</p>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel maxSize={80} defaultSize={60}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={80}>
              {/* editor */}
              {loading ? (
                <EditorSkeleton />
              ) : (
                <div className="w-full h-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={submissionId}
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Editor
                        language={"cpp"}
                        defaultLanguage="typescript"
                        theme={theme === "dark" ? "myTheme" : "vs-light"}
                        value={code}
                        className={`min-h-screen w-[100%] border border-gray-300`}
                        options={{
                          formatOnPaste: true,
                          formatOnType: true,
                          fontSize: 16,
                          cursorStyle: "line",
                          cursorSmoothCaretAnimation: "on",
                          cursorBlinking: "smooth",
                          cursorWidth: 1,
                          cursorSurroundingLines: 1,
                          multiCursorModifier: "ctrlCmd",
                          scrollBeyondLastLine: false,
                        }}
                        beforeMount={handleEditorDidMount}
                        onChange={handleCodeChange}
                        onMount={handleEditorDidMount}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel mma>
              <div className="h-full w-full flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Button
                    className="btn btn-primary"
                    onClick={() => setExpanded(!isExpanded)}
                  >
                    {isExpanded ? "Hide" : "Show"} Submission
                  </Button>
                  <Button className="btn btn-secondary">Reset</Button>
                </div>
                <div className="flex items-center space-x-4">
                  <Button className="btn btn-primary">Submit</Button>

                  <div className="relative inline-block text-left">
                    <div>
                      <Button className="btn btn-secondary">Language</Button>
                    </div>
                    <div
                      className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="options-menu"
                    >
                      <div className="py-1" role="none">
                        {supportedLanguages.map((lang) => (
                          <a
                            href="#"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            role="menuitem"
                            onClick={() => setLanguages(lang.language)}
                          >
                            {lang.language}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
