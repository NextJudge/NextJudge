"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useTheme } from "next-themes";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { apiGetLanguages, getPublicCustomInputSubmissionStatus, postPublicCustomInputSubmission } from "@/lib/api";
import { defaultEditorOptions } from "@/lib/constants";
import type { CustomInputResult, Language } from "@/lib/types";
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
  title: "Reverse a String",
  difficulty: "VERY EASY" as const,
  prompt: `Given a string, print it in reverse order.

## Input
A single line containing a string \`s\` (1 ≤ |s| ≤ 1000).

## Output
Print the reversed string.
`,
  sampleInput: "hello",
  expectedOutput: "olleh",
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
};

const getStarterCode = (language: Language): string => {
  return STARTER_CODE[language.name.toLowerCase()] || `// ${language.name}`;
};

export const LandingEditor = () => {
  const { theme: editorTheme } = useContext(ThemeContext);
  const { resolvedTheme } = useTheme();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);
  const [code, setCode] = useState<string>("");
  const [customInput, setCustomInput] = useState<string>(DEMO_PROBLEM.sampleInput);
  const [customInputResult, setCustomInputResult] = useState<CustomInputResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [currentTheme, setCurrentTheme] = useState<string>(editorTheme?.name || "hc-black");

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const langs = await apiGetLanguages();
        setLanguages(langs);
        const defaultLang = langs.find((l) => l.name.toLowerCase() === "python") || langs[0];
        if (defaultLang) {
          setCurrentLanguage(defaultLang);
          setCode(getStarterCode(defaultLang));
        }
      } catch (error) {
        console.error("Failed to fetch languages:", error);
        toast.error("Failed to load languages");
      }
    };
    fetchLanguages();
  }, []);

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

    const targetTheme = editorTheme?.name || "hc-black";
    applyThemeWithRetry(monaco, targetTheme);
  };

  const handleRun = async () => {
    if (!currentLanguage) {
      toast.error("Please select a language");
      return;
    }

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
      scrollbar: {
        vertical: "auto" as const,
        horizontal: "auto" as const,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    }),
    [screenWidth]
  );

  if (languages.length === 0) {
    return (
      <section className="w-full py-12 md:py-20 px-4 text-white" id="try-it">
        <div className="relative mx-auto w-full overflow-hidden rounded-3xl bg-black/90">
          <div aria-hidden className="absolute inset-0 bg-black/80" />
          <div className="relative py-16 md:py-24 px-6">
            <div className="flex items-center justify-center h-[600px] border border-osu/60 rounded-lg bg-black/80 mx-auto max-w-6xl">
              <Icons.loader className="w-8 h-8 animate-spin text-osu" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const isMobile = screenWidth < 768;

  return (
    <section className="w-full py-12 md:py-16 px-4 text-white" id="try-it">
      <div
        className="relative mx-auto w-full overflow-hidden rounded-3xl"
      >
        {/* <div aria-hidden className="absolute inset-0 bg-black/80" /> */}

        <div className="relative py-16 md:py-24 px-6">
          <div className="text-center mb-8">
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
            {/* mobile: stacked layout */}
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
                    {currentLanguage && (
                      <EditorLanguageSelect
                        languages={languages}
                        onLanguageSelect={handleLanguageSelect}
                        defaultLanguage={currentLanguage}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Button onClick={handleRun} disabled={isRunning} size="sm" className="gap-1.5">
                        {isRunning ? <Icons.loader className="w-3.5 h-3.5 animate-spin" /> : <Icons.play className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isRunning ? "Running..." : "Run"}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <Editor
                      loading={<div className="flex items-center justify-center h-full"><Icons.loader className="w-6 h-6 animate-spin text-primary" /></div>}
                      language={currentLanguage ? convertToMonacoLanguageName(currentLanguage) : "python"}
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
            {/* problem panel */}
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

            {/* editor panel */}
                  <ResizablePanel defaultSize={65} minSize={40} className="bg-black/70">
              <ResizablePanelGroup direction="vertical" className="h-full">
                {/* code editor */}
                <ResizablePanel defaultSize={65} minSize={30} className="min-h-0">
                  <div className="h-full flex flex-col">
                          <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-osu/40 bg-black/60">
                      <div className="flex items-center gap-3">
                        {currentLanguage && (
                          <EditorLanguageSelect
                            languages={languages}
                            onLanguageSelect={handleLanguageSelect}
                            defaultLanguage={currentLanguage}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={handleRun} disabled={isRunning} size="sm" className="gap-2">
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
                    <div className="flex-1 min-h-0">
                      <Editor
                        loading={
                                <div className="flex items-center justify-center h-full bg-black/80">
                                  <Icons.loader className="w-8 h-8 animate-spin text-osu" />
                          </div>
                        }
                        language={currentLanguage ? convertToMonacoLanguageName(currentLanguage) : "python"}
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

                {/* output panel */}
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

        {/* cta banner at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-8 pb-3 px-4">
              <div className="flex items-center justify-center gap-4 text-sm text-white">
                <span className="text-gray-300">Ready for more challenges?</span>
            <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="border-osu/60 text-white hover:bg-osu/20">
                <a href="/auth/login">Log In</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/auth/signup">Sign Up Free</a>
              </Button>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
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
        <label className="text-xs font-medium text-gray-300 uppercase tracking-wide">Input</label>
        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Enter input..."
          className="w-full h-[80px] md:h-[calc(100%-28px)] p-3 text-sm font-mono bg-black/60 text-white border border-osu/50 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-osu"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-300 uppercase tracking-wide">Output</label>
          {isRunning && (
            <SubmissionStatusBadge status="PENDING" showIcon variant="detailed" />
          )}
          {!isRunning && customInputResult && (
            <SubmissionStatusBadge status={customInputResult.status} showIcon variant="detailed" />
          )}
        </div>
        <div className={cn(
          "w-full h-[80px] md:h-[calc(100%-28px)] p-3 text-sm font-mono border rounded-md overflow-auto",
          rateLimitError ? "bg-red-900/60 border-red-500/70 text-red-200" :
            customInputResult?.stderr ? "bg-red-900/60 border-red-500/70 text-red-200" :
              "bg-black/60 border-osu/50 text-white"
        )}>
          {isRunning ? (
            <div className="flex items-center gap-2 text-gray-300">
              <Icons.loader className="w-4 h-4 animate-spin text-osu" />
              <span>Running...</span>
            </div>
          ) : rateLimitError ? (
              <span className="text-red-200">Rate limit exceeded. Please wait a moment.</span>
          ) : customInputResult?.stderr ? (
                <span className="text-red-200 whitespace-pre-wrap">{customInputResult.stderr}</span>
          ) : customInputResult?.stdout ? (
                  <span className="text-white whitespace-pre-wrap">{customInputResult.stdout}</span>
          ) : (
                    <span className="text-gray-400">Run your code to see output</span>
          )}
        </div>
      </div>
    </div>
  );
};
