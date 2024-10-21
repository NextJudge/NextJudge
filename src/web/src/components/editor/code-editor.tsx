"use client";

import { defaultEditorOptions } from "@/lib/constants";
import { ThemeContext } from "@/providers/editor-theme";
import { Language } from "@/lib/types";
import Editor, { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Icons } from "../icons";
import { Button } from "../ui/button";
import { EditorLanguageSelect } from "./editor-language-select";
import { EditorThemeSelector } from "./editor-theme-select";

const templates: Record<string, string> = {
  "c++": `#include <bits/stdc++.h>
using namespace std;

int main()
{



}
`,
  java: `import java.io.*;
import java.util.*;

public class Solution {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);



    }
}
`,
  c: `#include <stdlib.h>
#include <stdio.h>

int main(int argc, char** argv) {



    return 0;
}
`,
  kotlin: `import java.io.*
import java.util.*

fun main(args: Array<String>) {

}
`,
  typescript: `"use strict";
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
  python: ``,
  pypy: ``,
};

export default function CodeEditor({
  languages,
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
}: {
  languages: Language[],
  themes: any;
  problemId: number;
  setSubmissionId: (submissionId: number) => void;
  userId: number;
  code: string;
  setCode: (code: string) => void;
  submissionLoading: boolean;
  error: string | null;
  submissionId: number | null;
  handleSubmitCode: (languageId: string, problemId: number) => Promise<void>;
}) {
  //   const [code, setCode] = useState<string>(templates["TypeScript"]);
  const { theme } = useContext(ThemeContext);
  const [currentLanguage, setCurrentLanguage] = useState<Language>();

  // Need to wait to do this - it updates parent component otherwise causing a crash
  // setCode(templates[normalizeLanguageKey(languages[0].name)]);


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


  const handleLanguageSelect = (language: Language) => {
    setCurrentLanguage(language);
    if (templates[language.name]) {
      setCode(templates[language.name]);
    } else if (language.name === "javascript") {
      setCode(templates["TypeScript"]);
    } else {
      setCode("");
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
    await handleSubmitCode(currentLanguage?.id as string, problemId);
  };

  return (
    <div className="h-full overflow-y-scroll min-w-full">
      <div className="flex justify-between">
        <div className="justify-start my-2 px-2">
          <EditorLanguageSelect
            languages={languages}
            onLanguageSelect={handleLanguageSelect}
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
          currentLanguage?.name === "pypy"
            ? "python"
            : currentLanguage?.name === "c++"
            ? "cpp"
            : currentLanguage?.name
        }
        defaultLanguage={currentLanguage?.name}
        value={code}
        // The theme might not be loaded at this point yet
        // TODO FIX: the theme we want may not be loaded yet,
        // And so it defaults to the light theme
        theme={"vs-dark" }  // theme?.name
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
