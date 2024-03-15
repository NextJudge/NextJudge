"use client";
import Editor, { loader } from "@monaco-editor/react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useCallback, useLayoutEffect, useState } from "react";
import { EditorThemeSelector, Theme } from "./editor-combo";

export default function CodeEditor({
  themes,
  onSelect,
  selectedTheme,
  isThemeLoaded,
  setIsThemeLoaded,
}: any) {
  const [code, setCode] = useState(`"use strict";
const printLine = (x: string) => {
  console.log(x);
};

let inputString: string = "";
let currentLine: number = 0;

process.stdin.resume();
process.stdin.setEncoding("utf-8");

process.stdin.on("data", (inputStdin: string) => {
  inputString += inputStdin;
});

process.stdin.on("end", () => {
  inputString = inputString.split(" ").join(" ");
  main();
});

const readLine = (): string => {
  return inputString[currentLine++];
};

const main = () => {
    const n = parseInt(readLine());
    printLine(n.toString());
    const arr = readLine().split(" ").map(Number);
    for (let i = 0; i < n; i++) {
        printLine(arr[i].toString());
    }
    process.exit();
};
`);
  const [submissionId, setSubmissionId] = useState(0);
  const handleCodeChange = (value: string | undefined) => {
    setCode(value!);
  };
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editor.focus();
    // add support for process
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `declare var process: NodeJS.Process;`,
      "node_modules/@types/node/index.d.ts",
      "node:readline/promises"
    );
  };

  return (
    <>
      <div className="h-full overflow-y-scroll min-w-full">
        <div className="flex justify-end my-2 px-2">
          <EditorThemeSelector
            onSelect={onSelect}
            themes={themes}
            selectedTheme={selectedTheme}
          />
        </div>
        <AnimatePresence mode="wait">
          {isThemeLoaded && (
            <motion.div
              key={submissionId}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Editor
                language={"cpp"}
                defaultLanguage="typescript"
                theme={selectedTheme?.name}
                value={code}
                className={`min-h-screen w-[100%] overflow-y-scroll`}
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
                  scrollBeyondLastLine: true,
                }}
                //   beforeMount={handleEditorDidMount}
                onChange={handleCodeChange}
                onMount={handleEditorDidMount}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
