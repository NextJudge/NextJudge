"use client";
import { ThemeContext } from "@/providers/editor-theme";
import Editor from "@monaco-editor/react";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useState } from "react";
import { toast } from "sonner";
import { EditorLanguageSelect } from "./editor-language-select";
import { EditorThemeSelector } from "./editor-theme-select";
import { Icons } from "./icons";
import { Button } from "./ui/button";

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

  const [currentLanguage, setCurrentLanguage] = useState("typescript");
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitCode = async () => {
    setSubmissionLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Accepted!");
    } catch (error) {
      toast.error("There was an error submitting your code.");
    } finally {
      setSubmissionLoading(false);
    }
  };

  return (
    <>
      <div className="h-full overflow-y-scroll min-w-full">
        <div className="flex justify-between">
          <div className="justify-start my-2 px-2">
            <EditorLanguageSelect />
          </div>
          <div className="flex justify-center my-2 px-2 gap-2">
            <Button
              className="w-full"
              onClick={handleSubmitCode}
              disabled={submissionLoading}
              variant={error ? "destructive" : "ghost"}
            >
              {submissionLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Icons.loader className="w-6 h-6 animate-spin" />
                  <p>Loading...</p>
                </div>
              ) : (
                <>
                  {error ? (
                    <div className="text-sm text-center">{error}</div>
                  ) : (
                    <>Submit Code</>
                  )}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCode("");
                toast.success("Editor cleared successfully!");
              }}
            >
              Clear Editor
            </Button>
          </div>
          <div className="justify-end my-2 px-2">
            <EditorThemeSelector themes={themes} />
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
                  showUnused: true,
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
