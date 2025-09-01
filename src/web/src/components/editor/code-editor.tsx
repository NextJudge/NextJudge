"use client";

import { defaultEditorOptions } from "@/lib/constants";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { Language } from "@/lib/types";
import { convertToMonacoLanguageName } from "@/lib/utils";
import { ThemeContext } from "@/providers/editor-theme";
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
    typescript: `const input = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);
`,
    python: ``,
    pypy: ``,
};


function getLanguageTemplateCode(language: Language): string {
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
    setSubmissionId,
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
    code: string;
    setCode: (code: string) => void;
    submissionLoading: boolean;
    error: string | null;
    submissionId: number | null;
    handleSubmitCode: (languageId: string, problemId: number) => Promise<void>;
}) {
    const { theme, setTheme } = useContext(ThemeContext);
    const { defaultLanguage } = useSettingsStore();
    const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
        // Use default language from settings if available, otherwise fall back to languages[3]
        if (defaultLanguage && languages.some(lang => lang.id === defaultLanguage.id)) {
            return defaultLanguage;
        }
        return languages?.[3];
    });

    // Load template code on initial mount if we have a default language and the editor is empty
    useEffect(() => {
        if (currentLanguage && code.trim() === "") {
            const templateCode = getLanguageTemplateCode(currentLanguage);
            if (templateCode) {
                setCode(templateCode);
            }
        }
    }, [currentLanguage]);
    const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
            if (editorRef.current) {
                setTimeout(() => {
                    editorRef.current?.layout();
                }, 100);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (editorRef.current) {
            const timer = setTimeout(() => {
                editorRef.current?.layout();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [code]);

    // Update current language when default language changes
    useEffect(() => {
        if (defaultLanguage && languages.some(lang => lang.id === defaultLanguage.id)) {
            setCurrentLanguage(defaultLanguage);
        }
    }, [defaultLanguage, languages]);

    useEffect(() => {
        if (editorRef.current) {
            const container = editorRef.current.getContainerDomNode();
            const resizeObserver = new ResizeObserver(() => {
                if (editorRef.current) {
                    editorRef.current.layout();
                }
            });

            resizeObserver.observe(container);

            return () => {
                resizeObserver.disconnect();
            };
        }
    }, []);

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
        editorRef.current = editor;
        editor.focus();

        setTimeout(() => {
            editor.layout();
        }, 0);

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            allowJs: true,
            checkJs: true,
        });

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
        // Always load template code when switching languages
        setCode(getLanguageTemplateCode(language));
        setCurrentLanguage(language);
    };

    const editorOptions = useMemo(
        () => ({
            ...defaultEditorOptions,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on' as const,
            wrappingStrategy: 'advanced' as const,
            fontSize: screenWidth < 640 ? 12 : screenWidth < 1024 ? 13 : 14,
            lineHeight: screenWidth < 640 ? 18 : screenWidth < 1024 ? 19 : 20,
            fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
            minimap: {
                enabled: screenWidth > 1024 // Only show minimap on larger screens
            },
            lineNumbers: screenWidth < 640 ? 'off' as const : 'on' as const,
            glyphMargin: screenWidth > 768,
            folding: screenWidth > 768,
            lineDecorationsWidth: screenWidth < 640 ? 0 : 10,
            lineNumbersMinChars: screenWidth < 640 ? 0 : 3,
            renderLineHighlight: screenWidth < 640 ? 'none' as const : 'line' as const,
            // Ensure editor takes full width and height
            fixedOverflowWidgets: true,
            overviewRulerBorder: false,
            scrollbar: {
                vertical: 'auto' as const,
                horizontal: 'auto' as const,
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 14,
            },
        }),
        [screenWidth]
    );

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        await handleSubmitCode(currentLanguage?.id as string, problemId);
    };

    return (
        <div className="h-full overflow-hidden flex-1 flex flex-col bg-card">
            <div className="flex justify-between items-center flex-wrap gap-3 p-3 sm:p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                    <EditorLanguageSelect
                        languages={languages}
                        onLanguageSelect={handleLanguageSelect}
                        defaultLanguage={currentLanguage}
                    />
                </div>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Button
                        className="text-xs sm:text-sm px-3 sm:px-4 py-2 font-medium"
                        onClick={handleSubmit}
                        disabled={submissionLoading}
                        variant={error ? "destructive" : "default"}
                        size="sm"
                    >
                        {submissionLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Icons.loader className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">Submitting...</span>
                            </div>
                        ) : (
                            <>
                                {error ? (
                                    <div className="text-xs sm:text-sm text-center truncate max-w-[120px] sm:max-w-none">{error}</div>
                                ) : (
                                    <>
                                        <span className="hidden sm:inline">Submit Code</span>
                                        <span className="sm:hidden">Submit</span>
                                    </>
                                )}
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm px-3 sm:px-4 py-2"
                        onClick={() => {
                            setCode("");
                            toast.success("Editor cleared successfully!");
                        }}
                    >
                        <span className="hidden sm:inline">Clear Editor</span>
                        <span className="sm:hidden">Clear</span>
                    </Button>
                </div>
                <div className="flex items-center min-w-0">
                    <EditorThemeSelector themes={themes} />
                </div>
            </div>

            <Editor
                loading={
                    <div className="flex items-center justify-center h-full bg-background">
                        <Icons.loader className="w-8 h-8 animate-spin text-primary" />
                    </div>
                }
                language={convertToMonacoLanguageName(currentLanguage)}
                defaultLanguage={currentLanguage?.name}
                value={code}
                theme={theme?.name}
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
