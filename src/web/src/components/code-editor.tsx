"use client";
import { ThemeContext } from "@/providers/editor-theme";
import Editor from "@monaco-editor/react";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useState } from "react";
import { EditorThemeSelector } from "./editor-theme-select";
import { EditorLanguageSelect } from "./editor-language-select";
import { lang } from "moment";

export default function CodeEditor({ themes, languages }: any) {
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
  const { theme } = useContext(ThemeContext);

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

  console.log({ theme });

  const [currentLanguage, setCurrentLanguage] = useState('typescript');


  return (
    <>
      <div className="h-full overflow-y-scroll min-w-full">

        <div className="flex justify-between">

        <div className="justify-start my-2 px-2">
          <EditorLanguageSelect />
        </div>
        <div className="justify-end my-2 px-2">
          <EditorThemeSelector themes ={themes} />
        </div>
        </div>

        <AnimatePresence mode="wait">
          {theme?.name && (
            <motion.div
              key={submissionId}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Editor
                language={currentLanguage}
                defaultLanguage="typescript"
                value={code}
                theme={theme.name}
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
