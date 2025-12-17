"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Suspense, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useClickAway } from "react-use";
import { toast } from "sonner";

import { FALLBACK_TYPESCRIPT, getLanguagesResource } from "@/hooks/use-languages-suspense";
import { getPublicCustomInputSubmissionStatus, postPublicCustomInputSubmission } from "@/lib/api";
import { defaultEditorOptions } from "@/lib/constants";
import type { CustomInputResult, Language, SubmissionStatus } from "@/lib/types";
import { cn, convertToMonacoLanguageName } from "@/lib/utils";
import { ThemeContext } from "@/providers/editor-theme";

import { EditorLanguageSelect } from "@/components/editor/editor-language-select";
import { Icons } from "@/components/icons";
import { SubmissionStatusBadge } from "@/components/submissions/submission-status-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LandingProblemStatement } from "./landing-problem-statement";

const DEMO_PROBLEM = {
  title: "Reverse Multiple Lines",
  difficulty: "EASY" as const,
  prompt: `You are given a working solution to the problem "Reverse a String". This is to help you get an idea for how NextJudge handles input/output in each of our supported languages.

## Your Task

Extend the given solution to handle **multiple lines** of input. For each line of input, reverse it and print it on a separate line.

## Input
Multiple lines, each containing a string. The number of lines is at least 1 and at most 100. Each string has length between 1 and 1000.

## Output
For each line of input, print the reversed string on a separate line.

## Example

**Input:**
\`\`\`
hello
world
\`\`\`

**Output:**
\`\`\`
olleh
dlrow
\`\`\`
`,
  testCases: [
    { input: "hello", expected: "olleh", label: "Test Case 1" },
    { input: "hello\nworld", expected: "olleh\ndlrow", label: "Test Case 2" },
    { input: "a\nb\nc", expected: "a\nb\nc", label: "Test Case 3" },
    { input: "programming\ncontest", expected: "gnimmargorp\ntsetnoc", label: "Test Case 4" },
  ],
};

const STARTER_CODE: Record<string, string> = {
  python: `s = input()
print(s[::-1])
`,
  pypy: `s = input()
print(s[::-1])
`,
  javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

rl.on('line', (s) => {
  console.log(s.split('').reverse().join(''));
  rl.close();
});
`,
  typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

rl.on('line', (s: string) => {
  console.log(s.split('').reverse().join(''));
  rl.close();
});
`,
  "c++": `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    cin >> s;
    reverse(s.begin(), s.end());
    cout << s << endl;
    return 0;
}
`,
  c: `#include <stdio.h>
#include <string.h>

int main() {
    char s[1001];
    scanf("%s", s);
    int len = strlen(s);
    for (int i = len - 1; i >= 0; i--) {
        printf("%c", s[i]);
    }
    printf("\\n");
    return 0;
}
`,
  java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(new StringBuilder(s).reverse().toString());
    }
}
`,
  kotlin: `fun main() {
    val s = readLine()!!
    println(s.reversed())
}
`,
  rust: `use std::io;

fn main() {
    let mut s = String::new();
    io::stdin().read_line(&mut s).unwrap();
    s = s.trim().to_string();
    println!("{}", s.chars().rev().collect::<String>());
}
`,
  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    scanner.Scan()
    s := scanner.Text()
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    fmt.Println(string(runes))
}
`,
  ruby: `s = gets.chomp
puts s.reverse
`,
  lua: `s = io.read()
print(string.reverse(s))
`,
  haskell: `main = do
    s <- getLine
    putStrLn (reverse s)
`,
};

const getStarterCode = (language: Language): string => {
  return STARTER_CODE[language.name.toLowerCase()] || `// ${language.name}`;
};

const computeExpectedOutput = (input: string): string => {
  const lines = input.split('\n');
  return lines.map(line => line.split('').reverse().join('')).join('\n');
};

const compareOutput = (expected: string, actual: string): boolean => {
  const expectedLines = expected.trim().split('\n').map(line => line.trim());
  const actualLines = actual.trim().split('\n').map(line => line.trim());

  if (expectedLines.length !== actualLines.length) {
    return false;
  }

  for (let i = 0; i < expectedLines.length; i++) {
    if (expectedLines[i] !== actualLines[i]) {
      return false;
    }
  }

  return true;
};

const LandingEditorContent = () => {
  const { theme: editorTheme } = useContext(ThemeContext);

  const languagesResource = getLanguagesResource();
  const languages = languagesResource.read();
  const isLanguagesUnavailable = languages.length === 1 && languages[0].id === FALLBACK_TYPESCRIPT.id;
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const defaultLang = languages.find((l) => l.name.toLowerCase() === "typescript") || languages[0] || FALLBACK_TYPESCRIPT;
    return defaultLang;
  });
  const [code, setCode] = useState<string>(() => {
    const defaultLang = languages.find((l) => l.name.toLowerCase() === "typescript") || languages[0] || FALLBACK_TYPESCRIPT;
    return getStarterCode(defaultLang);
  });
  const [customInput, setCustomInput] = useState<string>(DEMO_PROBLEM.testCases[0].input);
  const [customInputResult, setCustomInputResult] = useState<CustomInputResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [currentTheme, setCurrentTheme] = useState<string>(editorTheme?.name || "hc-black");

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const isEditorFocusedRef = useRef(false);

  useEffect(() => {
    const checkForLanguageUpdate = () => {
      const updatedLanguagesResource = getLanguagesResource();
      const updatedLanguages = updatedLanguagesResource.read();
      const defaultLang = updatedLanguages.find((l) => l.name.toLowerCase() === "typescript") || updatedLanguages[0] || FALLBACK_TYPESCRIPT;
      if (currentLanguage.id === FALLBACK_TYPESCRIPT.id && defaultLang.id !== FALLBACK_TYPESCRIPT.id) {
        setCurrentLanguage(defaultLang);
        setCode(getStarterCode(defaultLang));
      }
    };

    checkForLanguageUpdate();
    const intervalId = setInterval(checkForLanguageUpdate, 500);
    return () => clearInterval(intervalId);
  }, [currentLanguage]);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      if (editorRef.current) {
        setTimeout(() => editorRef.current?.layout(), 100);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useClickAway(editorContainerRef, () => {
    setIsEditorFocused(false);
  });

  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      const targetTheme = editorTheme?.name || "hc-black";
      if (targetTheme !== currentTheme) {
        applyThemeWithRetry(monacoRef.current, targetTheme);
      }
    }
  }, [editorTheme?.name, currentTheme]);

  const handleLanguageSelect = (language: Language) => {
    setCurrentLanguage(language);
    setCode(getStarterCode(language));
  };

  const applyThemeWithRetry = async (monaco: Monaco, themeName: string, retryAttempt = 0): Promise<void> => {
    try {
      monaco.editor.setTheme(themeName);
      setCurrentTheme(themeName);
    } catch (error) {
      console.error(`Failed to load theme ${themeName} (attempt ${retryAttempt + 1}):`, error);
      if (retryAttempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (retryAttempt + 1)));
        return applyThemeWithRetry(monaco, themeName, retryAttempt + 1);
      } else {
        console.warn(`Theme ${themeName} failed to load after 3 attempts, falling back to hc-black`);
        try {
          monaco.editor.setTheme("hc-black");
          setCurrentTheme("hc-black");
        } catch (fallbackError) {
          console.error("Failed to load fallback theme hc-black:", fallbackError);
        }
      }
    }
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setTimeout(() => editor.layout(), 0);

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      allowJs: true,
      checkJs: true,
    });

    const editorElement = editor.getDomNode();
    if (editorElement && editorContainerRef.current) {
      editorContainerRef.current = editorElement as HTMLDivElement;
    }

    editor.onDidFocusEditorWidget(() => {
      setIsEditorFocused(true);
      isEditorFocusedRef.current = true;
    });

    editor.onDidBlurEditorWidget(() => {
      setIsEditorFocused(false);
      isEditorFocusedRef.current = false;
    });

    if (editorElement) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const textarea = editorElement.querySelector("textarea");
          if (textarea && document.activeElement === textarea) {
            e.preventDefault();
            e.stopPropagation();
            const selection = editor.getSelection();
            if (selection && selection.isEmpty()) {
              editor.trigger("keyboard", "type", { text: "  " });
            } else {
              editor.trigger("keyboard", "editor.action.indentLines", null);
            }
          }
        } else if (e.key === "Tab" && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const textarea = editorElement.querySelector("textarea");
          if (textarea && document.activeElement === textarea) {
            e.preventDefault();
            e.stopPropagation();
            editor.trigger("keyboard", "editor.action.outdentLines", null);
          }
        }
      };

      editorElement.addEventListener("keydown", handleKeyDown, true);

      const handleClick = () => {
        if (!isEditorFocusedRef.current) {
          editor.focus();
        }
      };

      editorElement.addEventListener("click", handleClick, true);
    }

    const targetTheme = editorTheme?.name || "hc-black";
    applyThemeWithRetry(monaco, targetTheme);
  };

  const handleRun = async () => {

    setIsRunning(true);
    setCustomInputResult(null);
    setRateLimitError(false);

    try {
      const runId = await postPublicCustomInputSubmission(code, currentLanguage.id, customInput);

      let result = await getPublicCustomInputSubmissionStatus(runId);
      let attempts = 0;
      const maxAttempts = 30;

      while (!result.finished && result.status === "PENDING" && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        result = await getPublicCustomInputSubmissionStatus(runId);
        attempts++;
      }

      const matchingTestCase = DEMO_PROBLEM.testCases.find(tc => tc.input === customInput);
      const expectedOutput = matchingTestCase ? matchingTestCase.expected : computeExpectedOutput(customInput);

      let finalStatus: SubmissionStatus = result.status;
      if (result.status === "ACCEPTED") {
        const comparisonResult = compareOutput(expectedOutput, result.stdout);

        if (!comparisonResult) {
          finalStatus = "WRONG_ANSWER";
        }
      }
      result = { ...result, status: finalStatus };

      setCustomInputResult(result);
    } catch (error) {
      console.error("Run failed:", error);
      if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
        setRateLimitError(true);
        toast.error("Rate limit exceeded. Please wait a moment before trying again.");
      } else {
        toast.error("Failed to run code. Please try again.");
      }
    } finally {
      setIsRunning(false);
    }
  };

  const editorOptions = useMemo(
    () => ({
      ...defaultEditorOptions,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: "on" as const,
      wrappingStrategy: "advanced" as const,
      fontSize: screenWidth < 640 ? 12 : screenWidth < 1024 ? 13 : 14,
      lineHeight: screenWidth < 640 ? 18 : screenWidth < 1024 ? 19 : 20,
      fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
      folding: screenWidth > 768,
      renderLineHighlight: "none" as const,
      guides: {
        indentation: false,
      },
      autoIndent: "full" as const,
      scrollbar: {
        vertical: "auto" as const,
        horizontal: "auto" as const,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        alwaysConsumeMouseWheel: false,
      },
    }),
    [screenWidth]
  );

  const isMobile = screenWidth < 768;

  return (
    <>
      <div
        className="relative mx-auto w-full overflow-hidden rounded-3xl"
      >
        <div className="relative py-10 md:py-14 px-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-medium font-sans text-white">
              Try a practice problem{" "}
              <span className="bg-gradient-to-br from-osu to-osu text-transparent bg-clip-text font-serif italic font-semibold">
                right now!
              </span>
            </h2>
            <p className="text-gray-300 text-lg mt-2">
              We've prepared a simple problem for you to try out. No sign-up needed.
            </p>
          </div>

          <div className={cn(
            "relative w-full mx-auto max-w-6xl",
            "h-[600px] md:h-[650px]",
            "border border-osu/60 rounded-lg shadow-lg overflow-hidden",
            "bg-black/80 backdrop-blur text-white"
          )}>
        {isMobile ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 flex flex-col">
              <Tabs defaultValue="problem" className="flex flex-col h-full">
                    <div className="border-b border-osu/50 bg-black/60 px-2">
                      <TabsList className="h-10 bg-transparent text-white">
                        <TabsTrigger value="problem" className="text-xs text-white data-[state=active]:text-osu">Problem</TabsTrigger>
                        <TabsTrigger value="code" className="text-xs text-white data-[state=active]:text-osu">Code</TabsTrigger>
                        <TabsTrigger value="output" className="text-xs text-white data-[state=active]:text-osu">Output</TabsTrigger>
                  </TabsList>
                </div>
                    <TabsContent value="problem" className="flex-1 overflow-auto m-0 p-4 text-white">
                  <div className="flex items-start justify-between gap-3 mb-4">
                        <h3 className="text-lg font-bold text-white">{DEMO_PROBLEM.title}</h3>
                        <Badge variant="secondary" className="text-xs shrink-0 bg-osu/20 text-osu border border-osu/60">
                      {DEMO_PROBLEM.difficulty.charAt(0) + DEMO_PROBLEM.difficulty.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  <LandingProblemStatement prompt={DEMO_PROBLEM.prompt} />
                </TabsContent>
                    <TabsContent value="code" className="flex-1 m-0 flex flex-col min-h-0 text-white">
                      <div className="flex items-center justify-between gap-2 p-2 border-b border-osu/50 bg-black/60">
                        <EditorLanguageSelect
                          languages={languages}
                          onLanguageSelect={handleLanguageSelect}
                          defaultLanguage={currentLanguage}
                          variant="landing"
                        />
                    <div className="flex items-center gap-2">
                          <Button onClick={handleRun} disabled={isRunning} size="sm" className="gap-1.5">
                        {isRunning ? <Icons.loader className="w-3.5 h-3.5 animate-spin" /> : <Icons.play className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isRunning ? "Running..." : "Run"}</span>
                      </Button>
                    </div>
                  </div>
                      <div className="flex-1 min-h-0" ref={editorContainerRef}>
                    <Editor
                      loading={<div className="flex items-center justify-center h-full"><Icons.loader className="w-6 h-6 animate-spin text-primary" /></div>}
                          language={convertToMonacoLanguageName(currentLanguage)}
                      value={code}
                          theme={currentTheme}
                      options={editorOptions}
                      onChange={(value) => setCode(value ?? "")}
                      onMount={handleEditorDidMount}
                    />
                  </div>
                </TabsContent>
                    <TabsContent value="output" className="flex-1 overflow-auto m-0 p-4 text-white">
                  <OutputPanel
                    customInput={customInput}
                    setCustomInput={setCustomInput}
                    customInputResult={customInputResult}
                    isRunning={isRunning}
                    rateLimitError={rateLimitError}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
                <ResizablePanelGroup direction="horizontal" className="h-full text-white">
                  <ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="bg-black/70 border-r border-osu/40">
              <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between gap-3 p-4 border-b border-osu/40 bg-black/60">
                        <h3 className="text-lg font-semibold text-white truncate">{DEMO_PROBLEM.title}</h3>
                        <Badge variant="secondary" className="text-xs shrink-0 bg-osu/20 text-osu border border-osu/60">
                    {DEMO_PROBLEM.difficulty.charAt(0) + DEMO_PROBLEM.difficulty.slice(1).toLowerCase()}
                  </Badge>
                </div>
                      <div className="flex-1 overflow-auto p-4 text-white">
                  <LandingProblemStatement prompt={DEMO_PROBLEM.prompt} />
                </div>
              </div>
            </ResizablePanel>

                  <ResizableHandle withHandle className="bg-osu/60 hover:bg-osu/80 transition-colors" />

                  <ResizablePanel defaultSize={65} minSize={40} className="bg-black/70">
              <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel defaultSize={65} minSize={30} className="min-h-0">
                  <div className="h-full flex flex-col">
                          <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-osu/40 bg-black/60">
                            <div className="flex items-center gap-3">
                              <EditorLanguageSelect
                                languages={languages}
                                onLanguageSelect={handleLanguageSelect}
                                defaultLanguage={currentLanguage}
                                variant="landing"
                              />
                      </div>
                      <div className="flex items-center gap-2">
                              <Button onClick={handleRun} disabled={isRunning || isLanguagesUnavailable} size="sm" className="gap-2">
                          {isRunning ? (
                            <>
                              <Icons.loader className="w-4 h-4 animate-spin" />
                              <span>Running...</span>
                            </>
                          ) : (
                            <>
                              <Icons.play className="w-4 h-4" />
                              <span>Run Code</span>
                            </>
                          )}
                          </Button>
                      </div>
                    </div>
                          <div className="flex-1 min-h-0" ref={editorContainerRef}>
                      <Editor
                        loading={
                                <div className="flex items-center justify-center h-full bg-black/80">
                                  <Icons.loader className="w-8 h-8 animate-spin text-osu" />
                          </div>
                        }
                              language={convertToMonacoLanguageName(currentLanguage)}
                        value={code}
                              theme={currentTheme}
                        options={editorOptions}
                        onChange={(value) => setCode(value ?? "")}
                        onMount={handleEditorDidMount}
                      />
                    </div>
                  </div>
                </ResizablePanel>

                      <ResizableHandle withHandle className="bg-osu/60 hover:bg-osu/80 transition-colors" />

                      <ResizablePanel defaultSize={35} minSize={15} maxSize={60} className="min-h-0 bg-black/70">
                  <div className="h-full flex flex-col">
                          <div className="flex items-center gap-2 px-3 py-2 border-b border-osu/40 bg-black/60">
                            <Icons.terminal className="w-4 h-4 text-osu" />
                            <span className="text-sm font-medium text-white">Output</span>
                    </div>
                          <div className="flex-1 overflow-auto p-4 text-white">
                      <OutputPanel
                        customInput={customInput}
                        setCustomInput={setCustomInput}
                        customInputResult={customInputResult}
                        isRunning={isRunning}
                        rateLimitError={rateLimitError}
                      />
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-8 pb-3 px-4">
              <div className="flex items-center justify-center gap-4 text-sm text-white">
                <span className="text-gray-300">Ready for more challenges?</span>
            <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="border-osu/60 text-white hover:bg-osu/20" disabled>
                <a href="/auth/login">Log In</a>
              </Button>
              <Button size="sm" asChild disabled>
                <a href="/auth/signup">Sign Up Free</a>
              </Button>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const LandingEditor = () => {
  return (
    <section className="w-full py-8 md:py-10 px-4 text-white" id="try-it">
      <Suspense
        fallback={
          <>
            <div className="relative mx-auto w-full overflow-hidden rounded-3xl">
              <div className="relative py-10 md:py-14 px-6">
                <div className="text-center mb-6">
                  <h2 className="text-3xl md:text-4xl font-medium font-sans text-white">
                    Try a practice problem{" "}
                    <span className="bg-gradient-to-br from-osu to-osu text-transparent bg-clip-text font-serif italic font-semibold">
                      right now!
                    </span>
                  </h2>
                  <p className="text-gray-300 text-lg mt-2">
                    We've prepared a simple problem for you to try out. No sign-up needed.
                  </p>
                </div>

                <div className={cn(
                  "relative w-full mx-auto max-w-6xl",
                  "h-[600px] md:h-[650px]",
                  "border border-osu/60 rounded-lg shadow-lg overflow-hidden",
                  "bg-black/80 backdrop-blur text-white"
                )}>
                  <div className="flex items-center justify-center h-full">
                    <Icons.loader className="w-8 h-8 animate-spin text-osu" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-8 pb-3 px-4">
                    <div className="flex items-center justify-center gap-4 text-sm text-white">
                      <span className="text-gray-300">Ready for more challenges?</span>
                      <div className="flex gap-2">
                        <div className="h-9 w-20 bg-black/60 border border-osu/60 rounded-md" />
                        <div className="h-9 w-24 bg-osu/20 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        }
      >
        <LandingEditorContent />
      </Suspense>
    </section>
  );
};

const OutputPanel = ({
  customInput,
  setCustomInput,
  customInputResult,
  isRunning,
  rateLimitError,
}: {
  customInput: string;
  setCustomInput: (value: string) => void;
  customInputResult: CustomInputResult | null;
  isRunning: boolean;
  rateLimitError: boolean;
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-4 h-full text-white">
      <div className="space-y-2">
        <div className="flex items-center gap-2 min-h-[20px]">
          <label className="text-xs font-medium text-gray-300 uppercase tracking-wide">Input</label>
        </div>
        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Enter input..."
          className="w-full min-h-[80px] p-3 text-sm font-mono bg-black/60 text-white border border-osu/50 rounded-md resize-y focus:outline-none focus:ring-1 focus:ring-osu"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 min-h-[20px]">
          <label className="text-xs font-medium text-gray-300 uppercase tracking-wide">Output</label>
          {isRunning && (
            <SubmissionStatusBadge status="PENDING" showIcon variant="detailed" />
          )}
          {!isRunning && customInputResult && (
            <SubmissionStatusBadge status={customInputResult.status} showIcon variant="detailed" />
          )}
        </div>
        <textarea
          readOnly
          value={
            isRunning
              ? ""
              : rateLimitError
                ? "Rate limit exceeded. Please wait a moment."
                : customInputResult?.stderr
                  ? customInputResult.stderr
                  : customInputResult?.stdout
                    ? customInputResult.stdout
                    : customInputResult?.status === "TIME_LIMIT_EXCEEDED"
                      ? "Your code took too long to execute."
                      : customInputResult?.status === "MEMORY_LIMIT_EXCEEDED"
                        ? "Your code used too much memory."
                        : customInputResult?.status === "RUNTIME_ERROR"
                          ? "Check your code for errors."
                          : customInputResult?.status === "COMPILE_TIME_ERROR"
                            ? "Check your code syntax."
                            : customInputResult?.status === "WRONG_ANSWER"
                              ? "Your output doesn't match the expected output."
                              : "Run code to see output"
          }
          className={cn(
            "w-full min-h-[80px] p-3 text-sm font-mono border rounded-md resize-y whitespace-pre-wrap",
            rateLimitError ? "bg-red-900/60 border-red-500/70 text-red-200" :
              customInputResult?.stderr ? "bg-red-900/60 border-red-500/70 text-red-200" :
                "bg-black/60 border-osu/50 text-white"
          )}
        />
      </div>
    </div>
  );
};
