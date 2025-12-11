"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useTheme } from "next-themes";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useThemesLoader } from "@/hooks/useThemeLoader";
import { apiGetLanguages, getPublicCustomInputSubmissionStatus, postPublicCustomInputSubmission } from "@/lib/api";
import { defaultEditorOptions } from "@/lib/constants";
import type { CustomInputResult, Language } from "@/lib/types";
import { cn, convertToMonacoLanguageName } from "@/lib/utils";
import { ThemeContext } from "@/providers/editor-theme";

import { EditorLanguageSelect } from "@/components/editor/editor-language-select";
import { EditorThemeSelector } from "@/components/editor/editor-theme-select";
import { Icons } from "@/components/icons";
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
  difficulty: "EASY" as const,
  prompt: `Given a string, print it reversed.

## Input
A single line containing a string \`s\` (1 ≤ |s| ≤ 1000).

## Output
Print the reversed string.
`,
  sampleInput: "hello",
  expectedOutput: "olleh",
};

const STARTER_CODE: Record<string, string> = {
  python: `# read input and print reversed
s = input()
print(s[::-1])
`,
  pypy: `# read input and print reversed
s = input()
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
  return STARTER_CODE[language.name.toLowerCase()] || `// write your solution for ${language.name}`;
};

export const LandingEditor = () => {
  const { theme: editorTheme } = useContext(ThemeContext);
  const { resolvedTheme } = useTheme();
  const { themes, loading: themesLoading } = useThemesLoader();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);
  const [code, setCode] = useState<string>("");
  const [customInput, setCustomInput] = useState<string>(DEMO_PROBLEM.sampleInput);
  const [customInputResult, setCustomInputResult] = useState<CustomInputResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1200);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

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

  const handleLanguageSelect = (language: Language) => {
    setCurrentLanguage(language);
    setCode(getStarterCode(language));
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    setTimeout(() => editor.layout(), 0);

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      allowJs: true,
      checkJs: true,
    });
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

      if (result.stderr) {
        toast.error("Execution completed with errors");
      } else {
        toast.success("Execution completed!");
      }
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
      minimap: { enabled: screenWidth > 1024 },
      lineNumbers: screenWidth < 640 ? ("off" as const) : ("on" as const),
      glyphMargin: screenWidth > 768,
      folding: screenWidth > 768,
      lineDecorationsWidth: screenWidth < 640 ? 0 : 10,
      lineNumbersMinChars: screenWidth < 640 ? 0 : 3,
      renderLineHighlight: screenWidth < 640 ? ("none" as const) : ("line" as const),
      fixedOverflowWidgets: true,
      overviewRulerBorder: false,
      scrollbar: {
        vertical: "auto" as const,
        horizontal: "auto" as const,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    }),
    [screenWidth]
  );

  if (languages.length === 0 || themesLoading) {
    return (
      <section className="container py-12 max-w-7xl" id="try-it">
        <div className="flex items-center justify-center h-[600px] border border-border rounded-lg bg-card">
          <Icons.loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  const isMobile = screenWidth < 768;

  return (
    <section className="container py-12 max-w-7xl" id="try-it">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-medium font-sans">
          Try it{" "}
          <span className="bg-gradient-to-br from-osu to-osu text-transparent bg-clip-text font-serif italic font-semibold">
            Now
          </span>
        </h2>
        <p className="text-muted-foreground text-lg mt-2">
          Write and run code directly in your browser. No sign-up required.
        </p>
      </div>

      <div className={cn(
        "relative w-full bg-background",
        "h-[600px] md:h-[650px]",
        "border border-border rounded-lg shadow-lg overflow-hidden"
      )}>
        {isMobile ? (
          <div className="flex flex-col h-full">
            {/* mobile: stacked layout */}
            <div className="flex-1 min-h-0 flex flex-col">
              <Tabs defaultValue="problem" className="flex flex-col h-full">
                <div className="border-b border-border bg-muted/30 px-2">
                  <TabsList className="h-10 bg-transparent">
                    <TabsTrigger value="problem" className="text-xs">Problem</TabsTrigger>
                    <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
                    <TabsTrigger value="output" className="text-xs">Output</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="problem" className="flex-1 overflow-auto m-0 p-4">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="text-lg font-bold text-foreground">{DEMO_PROBLEM.title}</h3>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {DEMO_PROBLEM.difficulty.charAt(0) + DEMO_PROBLEM.difficulty.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  <LandingProblemStatement prompt={DEMO_PROBLEM.prompt} />
                </TabsContent>
                <TabsContent value="code" className="flex-1 m-0 flex flex-col min-h-0">
                  <div className="flex items-center justify-between gap-2 p-2 border-b border-border bg-muted/30">
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
                      theme={editorTheme?.name || (resolvedTheme === "dark" ? "vs-dark" : "vs")}
                      options={editorOptions}
                      onChange={(value) => setCode(value ?? "")}
                      onMount={handleEditorDidMount}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="output" className="flex-1 overflow-auto m-0 p-4">
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
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* problem panel */}
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="bg-card">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-muted/30">
                  <h3 className="text-lg font-semibold text-foreground truncate">{DEMO_PROBLEM.title}</h3>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {DEMO_PROBLEM.difficulty.charAt(0) + DEMO_PROBLEM.difficulty.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <LandingProblemStatement prompt={DEMO_PROBLEM.prompt} />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border hover:bg-muted/50 transition-colors" />

            {/* editor panel */}
            <ResizablePanel defaultSize={65} minSize={40} className="bg-background">
              <ResizablePanelGroup direction="vertical" className="h-full">
                {/* code editor */}
                <ResizablePanel defaultSize={65} minSize={30} className="min-h-0">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border bg-muted/30">
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
                        <EditorThemeSelector themes={themes} />
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <Editor
                        loading={
                          <div className="flex items-center justify-center h-full bg-background">
                            <Icons.loader className="w-8 h-8 animate-spin text-primary" />
                          </div>
                        }
                        language={currentLanguage ? convertToMonacoLanguageName(currentLanguage) : "python"}
                        value={code}
                        theme={editorTheme?.name || (resolvedTheme === "dark" ? "vs-dark" : "vs")}
                        options={editorOptions}
                        onChange={(value) => setCode(value ?? "")}
                        onMount={handleEditorDidMount}
                      />
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-border hover:bg-muted/50 transition-colors" />

                {/* output panel */}
                <ResizablePanel defaultSize={35} minSize={15} maxSize={60} className="min-h-0 bg-card">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                      <Icons.terminal className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Output</span>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
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
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-3 px-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="text-muted-foreground">Ready for more challenges?</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/auth/login">Log In</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/auth/signup">Sign Up Free</a>
              </Button>
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
    <div className="grid md:grid-cols-2 gap-4 h-full">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Input</label>
        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Enter input..."
          className="w-full h-[80px] md:h-[calc(100%-28px)] p-3 text-sm font-mono bg-muted/30 border border-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Output</label>
        <div className={cn(
          "w-full h-[80px] md:h-[calc(100%-28px)] p-3 text-sm font-mono border rounded-md overflow-auto",
          rateLimitError ? "bg-destructive/10 border-destructive/50 text-destructive" :
          customInputResult?.stderr ? "bg-destructive/10 border-destructive/50" :
          "bg-muted/30 border-border"
        )}>
          {isRunning ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icons.loader className="w-4 h-4 animate-spin" />
              <span>Running...</span>
            </div>
          ) : rateLimitError ? (
            <span>Rate limit exceeded. Please wait a moment.</span>
          ) : customInputResult?.stderr ? (
            <span className="text-destructive whitespace-pre-wrap">{customInputResult.stderr}</span>
          ) : customInputResult?.stdout ? (
            <span className="text-foreground whitespace-pre-wrap">{customInputResult.stdout}</span>
          ) : (
            <span className="text-muted-foreground">Run your code to see output</span>
          )}
        </div>
      </div>
    </div>
  );
};
