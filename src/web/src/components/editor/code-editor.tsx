"use client";

import { defaultEditorOptions, defaultLanguage } from "@/lib/constants";
import { getBridgeUrl } from "@/lib/utils";
import { ThemeContext } from "@/providers/editor-theme";
import { Language } from "@/types";
import Editor, { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Icons } from "../icons";
import { Button } from "../ui/button";
import { EditorLanguageSelect } from "./editor-language-select";
import { EditorThemeSelector } from "./editor-theme-select";
import { fetchLanguages as apiFetchLanguages, postSolution } from "@/lib/api";

const templates: Record<string, string> = {
  "C++": `#include <bits/stdc++.h>
using namespace std;

int main()
{



}
`,
  Java: `import java.io.*;
import java.util.*;

public class Solution {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);



    }
}
`,
  C: `#include <stdlib.h>
#include <stdio.h>

int main(int argc, char** argv) {



    return 0;
}
`,
  Kotlin: `import java.io.*
import java.util.*

fun main(args: Array<String>) {

}
`,
  TypeScript: `"use strict";
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
  Python: ``,
  PyPy: ``,
};

export default function CodeEditor({
  themes,
  problemId,
  setSubmissionId,
  userId,
  code,
  setCode,
  submissionLoading,
  error,
  submissionId,
  handleSubmitCode,
  fetchSubmissionDetails,
}: {
  themes: any;
  problemId: number;
  setSubmissionId: (submissionId: number) => void;
  userId: number;
  code: string;
  setCode: (code: string) => void;
  submissionLoading: boolean;
  error: string | null;
  submissionId: number | null;
  handleSubmitCode: (languageId: number, problemId: number) => Promise<void>;
  fetchSubmissionDetails: () => Promise<void>;
}) {
  //   const [code, setCode] = useState<string>(templates["TypeScript"]);
  //   const [submissionId, setSubmissionId] = useState<number>(0);
  const { theme } = useContext(ThemeContext);
  const [languages, setLanguages] = useState([]);
  const [currentLanguage, setCurrentLanguage] =
    useState<Language>(defaultLanguage);
  //   const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  //   const [error, setError] = useState<string | null>(null);
  //   const { handleSubmitCode, error, submissionId, submissionLoading } =
  //     useSubmitCode(userId, code);

  const normalizeLanguageKey = (languageName: string) => {
    const normalizedLanguageNames: Record<string, string> = {
      "c++": "C++",
      java: "Java",
      c: "C",
      kotlin: "Kotlin",
      typescript: "TypeScript",
      pypy: "PyPy",
      python: "Python",
    };
    return normalizedLanguageNames[languageName.toLowerCase()];
  };

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const getEditorValue = () => {
    return editorRef.current?.getValue();
  };

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editor.focus();

    // add support for process
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `declare var process: NodeJS.Process;`
    );
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      "node:readline/promises"
    );
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      "node_modules/@types/node/index.d.ts"
    );
  };

  useEffect(() => {
    async function fetchLanguages() {
      try {
        const data = await apiFetchLanguages()
        setLanguages(data)
        setCode(templates[normalizeLanguageKey(data[0].name)]);
      } catch (error) {
        console.error("Failed to fetch languages", error);
      }
    }
    fetchLanguages();
  }, []);

  const handleLanguageSelect = (language: Language) => {
    setCurrentLanguage(language);
    if (templates[normalizeLanguageKey(language.name)]) {
      setCode(templates[normalizeLanguageKey(language.name)]);
    } else if (language.name === "javascript") {
      setCode(templates["TypeScript"]);
    } else {
      setCode("");
    }
  };

  const handleSubmitCode = async () => {
    setSubmissionLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const selectedLanguage = languages.find(
        (lang: Language) => lang.extension === currentLanguage?.extension
      );
      if (!selectedLanguage) {
        throw new Error("Language not found");
      }

      const data = await postSolution(code, currentLanguage.id, problemId, "25c054a1-e306-4851-b229-67acffa65e56");
      setSubmissionResult(data);
      toast.success("Accepted!");
    } catch (error: unknown) {
      toast.error("There was an error submitting your code.");
      setError(error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setSubmissionLoading(false);
    }
  };

  // TODO: Create a store for the editor options
  const editorOptions = useMemo(
    () => ({
      ...defaultEditorOptions,
    }),
    []
  );

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await handleSubmitCode(currentLanguage.id, problemId);
  };

  return (
    <div className="h-full overflow-y-scroll min-w-full">
      <div className="flex justify-between">
        <div className="justify-start my-2 px-2">
          <EditorLanguageSelect
            onLanguageSelect={handleLanguageSelect}
            // languages={languages}
          />
        </div>
        <div className="flex justify-center my-2 px-2 gap-2">
          <Button
            className="w-full"
            onClick={handleSubmit}
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
      <Editor
        loading={
          <Icons.loader className="w-6 h-6 animate-spin text-orange-700" />
        }
        language={
          currentLanguage?.name === "PyPy"
            ? "python"
            : currentLanguage?.name === "C++"
            ? "cpp"
            : currentLanguage?.name.toLowerCase()
        }
        defaultLanguage={currentLanguage?.name.toLowerCase()}
        value={code}
        theme={theme?.name}
        className="min-h-screen w-[100%] overflow-y-scroll"
        options={editorOptions}
        onChange={(value) => {
          // @ts-ignore
          setCode(value);
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
}
