"use client";

import { FALLBACK_TYPESCRIPT } from "@/hooks/use-languages-suspense";
import { defaultEditorOptions } from "@/lib/constants";
import { useSettingsStore } from "@/lib/stores/settings-store";
import type { Language } from "@/lib/types";
import { convertToMonacoLanguageName } from "@/lib/utils";
import { ThemeContext } from "@/providers/editor-theme";
import type { Theme } from "@/types";
import Editor, { type Monaco, useMonaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Check, HelpCircle, Play, RotateCcw } from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useClickAway } from "react-use";
import { toast } from "sonner";
import { Icons } from "../icons";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
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
    typescript: `const input = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);
`,
    python: ``,
    pypy: ``,
};

const CHEETCODE_EDITOR_THEME = "nextjudge-cheetcode";

function getLanguageTemplateCode(language: Language): string {
    if (language.template) {
        return language.template;
    }

    if (templates[language.name]) {
        return templates[language.name];
    } else if (language.name === "javascript") {
        return templates["typescript"]
    } else {
        return ""
    }
}

export default function CodeEditor({
    languages,
    themes,
    problemId,
    code,
    setCode,
    submissionLoading,
    handleSubmitCode,
    runLoading,
    onRun,
}: {
    languages: Language[],
    themes: Theme[];
    problemId: number;
    code: string;
    setCode: (code: string) => void;
    submissionLoading: boolean;
    handleSubmitCode: (languageId: string, problemId: number) => Promise<void>;
    runLoading: boolean;
    onRun: (languageId: string) => Promise<void>;
}) {
    const { theme } = useContext(ThemeContext);
    const monaco = useMonaco();
    const { defaultLanguage } = useSettingsStore();
    const isLanguagesUnavailable = languages.length === 1 && languages[0].id === FALLBACK_TYPESCRIPT.id;
    const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
        if (defaultLanguage && languages.some(lang => lang.id === defaultLanguage.id)) {
            return defaultLanguage;
        }
        return languages?.[3];
    });

    const hasLoadedInitialTemplate = useRef(false);
    const previousLanguageRef = useRef<Language | null>(null);

    useEffect(() => {
        if (currentLanguage && !hasLoadedInitialTemplate.current && code.trim() === "") {
            const templateCode = getLanguageTemplateCode(currentLanguage);
            if (templateCode) {
                setCode(templateCode);
                hasLoadedInitialTemplate.current = true;
                previousLanguageRef.current = currentLanguage;
            }
        }
    }, []);

    useEffect(() => {
        if (currentLanguage && hasLoadedInitialTemplate.current && previousLanguageRef.current?.id !== currentLanguage.id) {
            const templateCode = getLanguageTemplateCode(currentLanguage);
            if (templateCode) {
                setCode(templateCode);
            }
            previousLanguageRef.current = currentLanguage;
        }
    }, [currentLanguage, setCode]);

    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const editorContainerRef = useRef<HTMLDivElement | null>(null);

    useClickAway(editorContainerRef, () => {
        // retained for potential future focus styling
    });

    useEffect(() => {
        if (defaultLanguage && languages.some(lang => lang.id === defaultLanguage.id)) {
            setCurrentLanguage(defaultLanguage);
        }
    }, [defaultLanguage, languages]);

    useEffect(() => {
        if (editorRef.current) {
            const container = editorRef.current.getContainerDomNode();
            const resizeObserver = new ResizeObserver(() => {
                editorRef.current?.layout();
            });

            resizeObserver.observe(container);

            return () => {
                resizeObserver.disconnect();
            };
        }
    }, []);

    useEffect(() => {
        if (!monaco || !theme?.name) {
            return;
        }

        const applyEditorTheme = async () => {
            const isLightTheme = theme.name === "light" || theme.name.includes("light");
            const editorBackground = isLightTheme ? "#ffffff" : "#0a0a0a";
            const patchedThemeName = `${theme.name}-workspace`;

            if (theme.fetch) {
                try {
                    const response = await fetch(theme.fetch);
                    const themeData = await response.json();
                    monaco.editor.defineTheme(patchedThemeName, {
                        ...themeData,
                        colors: {
                            ...themeData.colors,
                            "editor.background": editorBackground,
                        },
                    });
                    monaco.editor.setTheme(patchedThemeName);
                    return;
                } catch {
                    // Fall through to built-in theme patch below.
                }
            }

            monaco.editor.defineTheme(patchedThemeName, {
                base: isLightTheme ? "vs" : "vs-dark",
                inherit: true,
                rules: [],
                colors: {
                    "editor.background": editorBackground,
                },
            });
            monaco.editor.setTheme(patchedThemeName);
        };

        void applyEditorTheme();
    }, [monaco, theme]);

    const handleSubmit = useCallback(async () => {
        await handleSubmitCode(currentLanguage?.id as string, problemId);
    }, [currentLanguage?.id, handleSubmitCode, problemId]);

    const handleRun = useCallback(async () => {
        await onRun(currentLanguage?.id as string);
    }, [currentLanguage?.id, onRun]);

    const actionsDisabled =
        isLanguagesUnavailable || runLoading || submissionLoading;

    useEffect(() => {
        const handleSubmitShortcut = (event: KeyboardEvent) => {
            if (!(event.ctrlKey || event.metaKey) || event.key !== "Enter") {
                return;
            }

            if (actionsDisabled) {
                return;
            }

            event.preventDefault();
            void handleSubmit();
        };

        window.addEventListener("keydown", handleSubmitShortcut);
        return () => window.removeEventListener("keydown", handleSubmitShortcut);
    }, [actionsDisabled, handleSubmit]);

    const handleEditorDidMount = (
        editor: editor.IStandaloneCodeEditor,
        monacoInstance: Monaco
    ) => {
        editorRef.current = editor;
        editor.focus();

        setTimeout(() => {
            editor.layout();
        }, 0);

        monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
            module: monacoInstance.languages.typescript.ModuleKind.CommonJS,
            allowJs: true,
            checkJs: true,
        });

        monacoInstance.languages.typescript.javascriptDefaults.setEagerModelSync(true);
        monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
            `declare var process: NodeJS.Process;`
        );
        monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
            "node:readline/promises"
        );
        monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
            "node_modules/@types/node/index.d.ts"
        );

        const editorElement = editor.getDomNode();
        if (editorElement && editorContainerRef.current) {
            editorContainerRef.current = editorElement as HTMLDivElement;
        }

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
        }
    };

    const handleLanguageSelect = (language: Language) => {
        setCode(getLanguageTemplateCode(language));
        setCurrentLanguage(language);
    };

    const handleResetToStarterCode = () => {
        if (!currentLanguage) {
            return;
        }

        const templateCode = getLanguageTemplateCode(currentLanguage);
        setCode(templateCode);
        toast.success(`Reset to ${currentLanguage.name} starter code.`);
    };

    const editorOptions = useMemo(
        () => ({
            ...defaultEditorOptions,
            automaticLayout: true,
            minimap: { enabled: false },
            quickSuggestions: false,
            scrollBeyondLastLine: false,
            contextmenu: false,
            wordWrap: "on" as const,
            fontSize: 14,
            lineHeight: 20,
            fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
            lineNumbers: "on" as const,
            glyphMargin: false,
            folding: true,
            guides: {
                indentation: false,
            },
            fixedOverflowWidgets: true,
            overviewRulerBorder: false,
            scrollbar: {
                vertical: "auto" as const,
                horizontal: "auto" as const,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
            },
        }),
        []
    );

    const monacoTheme = theme?.name ? `${theme.name}-workspace` : CHEETCODE_EDITOR_THEME;

    return (
        <Tabs defaultValue="code" className="h-full flex flex-col">
            <TabsList className="flex justify-start w-full h-9 shrink-0 rounded-none bg-muted/40 p-1">
                <TabsTrigger value="code" className="px-2 py-1 h-7">
                    Code
                </TabsTrigger>
            </TabsList>
            <TabsContent value="code" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between gap-2 h-8 px-2 py-1 shrink-0">
                        <EditorLanguageSelect
                            languages={languages}
                            onLanguageSelect={handleLanguageSelect}
                            defaultLanguage={currentLanguage}
                            variant="compact"
                        />
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1.5 rounded-r-none border-r-0 px-2.5 shadow-none"
                                    onClick={() => void handleRun()}
                                    disabled={actionsDisabled}
                                    aria-label="Run code against test cases"
                                >
                                    {runLoading ? (
                                        <Icons.loader className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Play className="h-3.5 w-3.5" />
                                    )}
                                    Run
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-7 gap-1.5 rounded-l-none px-2.5 bg-[var(--success-green)] text-white hover:bg-[var(--success-green)]/90 shadow-none"
                                    onClick={() => void handleSubmit()}
                                    disabled={actionsDisabled}
                                    aria-label="Submit solution"
                                >
                                    {submissionLoading ? (
                                        <Icons.loader className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Check className="h-3.5 w-3.5" />
                                    )}
                                    Submit
                                </Button>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <EditorThemeSelector themes={themes} variant="compact" />
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-6 p-1"
                                        aria-label="Keyboard shortcuts"
                                    >
                                        <HelpCircle className="!w-3.5 !h-3.5" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle>Keyboard shortcuts</DialogTitle>
                                        <DialogDescription>
                                            Common editor actions
                                        </DialogDescription>
                                    </DialogHeader>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between gap-4">
                                            <dt>Submit solution</dt>
                                            <dd className="font-mono text-xs text-muted-foreground">
                                                Ctrl/Cmd + Enter
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <dt>Indent selection</dt>
                                            <dd className="font-mono text-xs text-muted-foreground">
                                                Tab
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <dt>Outdent selection</dt>
                                            <dd className="font-mono text-xs text-muted-foreground">
                                                Shift + Tab
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <dt>Select all in editor</dt>
                                            <dd className="font-mono text-xs text-muted-foreground">
                                                Ctrl/Cmd + A
                                            </dd>
                                        </div>
                                    </dl>
                                </DialogContent>
                            </Dialog>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-6 p-1"
                                        onClick={handleResetToStarterCode}
                                        aria-label="Reset to starter code"
                                    >
                                        <RotateCcw className="!w-3.5 !h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Reset to starter code</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                    <Separator />
                    <div ref={editorContainerRef} className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            loading={
                                <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
                                    <Icons.loader className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            }
                            language={convertToMonacoLanguageName(currentLanguage)}
                            defaultLanguage={currentLanguage?.name}
                            value={code}
                            theme={monacoTheme}
                            options={editorOptions}
                            onChange={(value) => setCode(value ?? "")}
                            onMount={handleEditorDidMount}
                        />
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}
