"use client";
import { loader } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";

export interface ThemeProviderProps {
    children: React.ReactNode;
}

export interface Theme {
    name: string;
    fetch: string;
}

export interface ThemeContextType {
    theme: Theme | null;
    setTheme: (theme: Theme | null) => void;
}

const MEDIA = '(prefers-color-scheme: dark)'

export const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent) => {
    if (!e) e = window.matchMedia(MEDIA)
    const isDark = e.matches
    const systemTheme = isDark ? 'dark' : 'light'
    return systemTheme
}

export const resolveDefaultThemeToUse = (themeToUse: string) => {
    // It's 'system' sometimes
    if (themeToUse === "system") {
        themeToUse = getSystemTheme()
    }

    if (themeToUse === "dark") {
        return defaultThemes.builtin_dark;
    } else {
        return defaultThemes.builtin_light;
    }
}

const defaultThemes= {
    dark: {
        name: "brilliance-black",
        fetch: "/themes/brilliance-black.json",
    },
    light: {
        name: "github-light",
        fetch: "/themes/github-light.json",
    },
    builtin_dark: {
        name: "vs-dark",
        fetch: ""
    },
    builtin_light: {
        name: "light",
        fetch: ""
    }
} as const;


export const ThemeContext = React.createContext<ThemeContextType>({
    theme: null,
    setTheme: () => { },
});



export const EditorThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
}) => {
    
    // Theme from "next-theme" - this is set implicitly
    // by the global "dark-mode"/"light-mode" switch
    const { resolvedTheme: nextThemeResolvedTheme } = useTheme();

    // The vs-dark and light are baked in and always available.
    // The other ones we need to wait to get downloaded to work
    const startingTheme = getSystemTheme() === "dark" ? defaultThemes.builtin_dark : defaultThemes.builtin_light
    const [theme, setTheme] = useState<Theme | null>(startingTheme);

    useEffect(() => {
        // nextThemeResolvedTheme is either "system","light","dark"
        // TODO: if custom themes are loaded, resolve this to the defaults in defaultThemes (or user selected defaults for light + dark mode)
        if (nextThemeResolvedTheme){
            setTheme(resolveDefaultThemeToUse(nextThemeResolvedTheme))
        }
    }, [nextThemeResolvedTheme]);

    // Explicitly set custom themes
    const setCustomTheme = (selectedTheme: Theme | null) => {
        if (
            selectedTheme &&
            selectedTheme.name !== "dark" &&
            selectedTheme.name !== "light"
        ) {
            setTheme(selectedTheme);
            loader.init().then((monaco) => {
                if (selectedTheme) monaco.editor.setTheme(selectedTheme.name);
            });
        } else {
            console.trace(selectedTheme)
            console.warn("Cannot set default themes as custom themes.");
        }
    };
    
    return (
        <ThemeContext.Provider value={{ theme, setTheme: setCustomTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
