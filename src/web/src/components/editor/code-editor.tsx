"use client";
import { ThemeContext } from "@/providers/editor-theme";
import Editor from "@monaco-editor/react";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { Icons } from "../icons";
import { Button } from "../ui/button";
import { EditorLanguageSelect, Language } from "./editor-language-select";
import { EditorThemeSelector } from "./editor-theme-select";
import { getBridgeUrl } from "@/lib/utils";

export default function CodeEditor({ themes }: any) {
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

  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLanguages() {
      try {
        const response = await fetch("http://localhost:3000/languages");
        const data = await response.json();
        setLanguages(data);
        setCurrentLanguage(data[0]); // Optionally set the first language as the default
      } catch (error) {
        console.error("Failed to fetch languages", error);
      }
    }
    fetchLanguages();
  }, []);

  const handleLanguageSelect = (language: Language) => {
    setCurrentLanguage(language);
  };

  const handleSubmitCode = async () => {
    setSubmissionLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const selectedLanguage = languages.find(
        (lang) => lang.extension === currentLanguage?.extension
      );
      if (!selectedLanguage) {
        throw new Error("Language not found");
      }

      const response = await fetch("http://localhost:3000/submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: code,
          language_id: selectedLanguage.id,
          problem_id: 1, // Gonna need to change this to the actual problem ID
          user_id: 1, // Also gonna need to change this to the actual user ID
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit code");
      }

      const data = await response.json();
      setSubmissionResult(data);
      toast.success("Accepted!");
    } catch (error) {
      toast.error("There was an error submitting your code.");
      setError(error.message);
    } finally {
      setSubmissionLoading(false);
    }
  };

  return (
    <>
      <div className="h-full overflow-y-scroll min-w-full">
        <div className="flex justify-between">
          <div className="justify-start my-2 px-2">
            <EditorLanguageSelect
              onLanguageSelect={handleLanguageSelect}
              languages={languages}
            />
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
                language={currentLanguage?.extension.replace(".", "")}
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
