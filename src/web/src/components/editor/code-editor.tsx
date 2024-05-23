import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "@/providers/editor-theme";
import Editor from "@monaco-editor/react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Icons } from "../icons";
import { Button } from "../ui/button";
import { EditorLanguageSelect, Language } from "./editor-language-select";
import { EditorThemeSelector } from "./editor-theme-select";
import { getBridgeUrl } from "@/lib/utils";

const templates = {
  "C++": `#include <bits/stdc++.h>
using namespace std;

int main()
{



}
`,
  "Java": `import java.io.*;
import java.util.*;

public class Solution {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);

        

    }
}
`,
  "C": `#include <stdlib.h>
#include <stdio.h>

int main(int argc, char** argv) {

    

    return 0;
}
`,
  "Kotlin": `import java.io.*
import java.util.*

fun main(args: Array<String>) {

}
`,
  "TypeScript": `"use strict";
const printLine = (x: string) => {
  console.log(x);
};

let inputString = "";
let currentLine = 0;

process.stdin.resume();
process.stdin.setEncoding("utf-8");

process.stdin.on("data", (inputStdin) => {
  inputString += inputStdin;
});

process.stdin.on("end", () => {
  inputString = inputString.split(" ").join(" ");
  main();
});

const readLine = () => {
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
`,
  "Python": ` `,
  "PyPy": ` `,
};

const normalizeLanguageKey = (languageName) => {
  const normalizedLanguageNames = {
    "c++": "C++",
    "java": "Java",
    "c": "C",
    "kotlin": "Kotlin",
    "typescript": "TypeScript",
    "pypy": "PyPy",
    "python": "Python",
  };
  return normalizedLanguageNames[languageName.toLowerCase()] || languageName;
};

export default function CodeEditor({ themes, problemId }) {
  const [code, setCode] = useState(templates["TypeScript"]);
  const [submissionId, setSubmissionId] = useState(0);
  const { theme } = useContext(ThemeContext);
  const [languages, setLanguages] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCodeChange = (value) => {
    setCode(value || "");
  };

  const handleEditorDidMount = (editor, monaco) => {
    editor.focus();

    // add support for process
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `declare var process: NodeJS.Process;`,
      "node_modules/@types/node/index.d.ts",
      "node:readline/promises"
    );
  };

  useEffect(() => {
    async function fetchLanguages() {
      try {
        const response = await fetch(`${getBridgeUrl()}/languages`);
        const data = await response.json();
        setLanguages(data);
        setCurrentLanguage(data[0]); // Optionally set the first language as the default
      } catch (error) {
        console.error("Failed to fetch languages", error);
      }
    }
    fetchLanguages();
  }, []);

  const handleLanguageSelect = (language) => {
    setCurrentLanguage(language);
    const normalizedLanguage = normalizeLanguageKey(language.name);
    if (templates[normalizedLanguage]) {
      setCode(templates[normalizedLanguage]);
    }
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

      const response = await fetch(`${getBridgeUrl()}/submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: code,
          language_id: selectedLanguage.id,
          problem_id: problemId,
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
              language={currentLanguage?.extension.replace(".", "") || "typescript"}
              defaultLanguage="typescript"
              value={code}
              theme={theme.name}
              className="min-h-screen w-[100%] overflow-y-scroll"
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
  );
}
