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

const defaultThemes: Record<string, Theme> = {
    dark: {
        name: "brilliance-black",
        fetch: "/themes/brilliance-black.json",
    },
    light: {
        name: "github-light",
        fetch: "/themes/github-light.json",
    },
};

export const ThemeContext = React.createContext<ThemeContextType>({
    theme: null,
    setTheme: () => { },
});

const MEDIA = '(prefers-color-scheme: dark)'

const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent) => {
    if (!e) e = window.matchMedia(MEDIA)
    const isDark = e.matches
    const systemTheme = isDark ? 'dark' : 'light'
    return systemTheme
}

export const EditorThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
}) => {

    // It's 'system' sometimes
    const resolveThemeToUse = (themeToUse: string) => {
        if (themeToUse === "system") {
            themeToUse = getSystemTheme()
        }

        if (themeToUse === "dark") {
            return defaultThemes.dark;
        } else {
            return defaultThemes.light;
        }
    }

    const { resolvedTheme } = useTheme();
    const [theme, setTheme] = useState<Theme | null>(resolveThemeToUse(resolvedTheme as string));

    // On mount, set the default theme
    useEffect(() => {
        setTheme(resolveThemeToUse(resolvedTheme as string))
    }, [resolvedTheme, theme]);

    // Explicitly set custom themes
    const setCustomTheme = (selectedTheme: Theme | null) => {
        if (
            selectedTheme &&
            selectedTheme.name !== "dark" &&
            selectedTheme.name !== "light"
        ) {
            setTheme(selectedTheme);
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
