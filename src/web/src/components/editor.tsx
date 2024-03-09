"use client";

import "@/app/globals.css";
import { Button } from "@/components/ui/button";
import Editor, { loader } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useLayoutEffect, useRef, useState } from "react";
import { useCollapse } from "react-collapsed";
import Latex from "react-latex";
import Split from "react-split";

const problemStatement = `
Given a general quadratic equation of the form
$$ax^{2} + bx + c = 0$$
with $x$ representing an unknown, with $a$, $b$ and $c$ representing constants, and with $a \\ne 0$, the quadratic formula is:
$$x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}$$

`;
const BRIDGE_ENDPOINT = `http://localhost:8080/api/v1`;

export default function EditorComponent() {
  const [code, setCode] = useState(`/**
    * @param {string}
    * @return {boolean}
    */

    var isPathCrossing = function(path) {
        let x = 0;
        let y = 0;
        const set = new Set();
        set.add(x + "," + y);
        for (let i = 0; i < path.length; i++) {
            if (path[i] === "N") {
                y++;
            } else if (path[i] === "S") {
                y--;
            } else if (path[i] === "E") {
                x++;
            } else if (path[i] === "W") {
                x--;
            }
            if (set.has(x + "," + y)) {
                return true;
            }
            set.add(x + "," + y);
        }
        return false;
    };`);
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
    <>
      <Split
        sizes={[20, 90]}
        minSize={450}
        maxSize={1000}
        expandToMin={false}
        gutterSize={20}
        className="split"
        direction="horizontal"
      >
        <div className="panel sum max-h-[calc(100vh-4rem)] overflow-y-auto max-w-full p-4">
          <div>
            <Latex>{problemStatement}</Latex>
          </div>
        </div>
        <div className="panel mx-auto p-4">
          <div className="flex w-full flex-row justify-between space-x-4 rounded-md border-1 border-neutral-600 px-12 text-center">
            <div className="flex flex-col items-center justify-center gap-12 align-middle my-2">
              <Button onClick={() => {}}>Submit</Button>
            </div>
          </div>
          <Editor
            language={"cpp"}
            defaultLanguage="cpp"
            loading={<div>Loading...</div>}
            theme={theme === "dark" ? "myTheme" : "vs-light"}
            value={code}
            className={`panel min-h-[calc(100vh-10rem)] min-w-[100%] rounded-md border-2 border-slate-600/25`}
            options={{
              formatOnPaste: true,
              formatOnType: true,
              fontSize: 14,
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
        </div>
      </Split>
    </>
  );
}
