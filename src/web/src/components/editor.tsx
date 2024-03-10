"use client";

import "@/app/globals.css";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Editor, { loader } from "@monaco-editor/react";
import "katex/dist/katex.min.css";
import { useTheme } from "next-themes";
import { useLayoutEffect, useRef, useState } from "react";
import { useCollapse } from "react-collapsed";

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
    });
  }, []);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  const handleCodeChange = (ev: any) => {
    setCode(ev.target.value);
  };

  return (
    <div className="w-full h-full">
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
          {/* editor */}
          <Editor
            language={"cpp"}
            defaultLanguage="typescript"
            loading={<div>Loading...</div>}
            theme={theme === "dark" ? "myTheme" : "vs-light"}
            value={code}
            className={`min-h-[85dvh] w-[100%]`}
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
