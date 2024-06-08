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
  setTheme: () => {},
});

export const EditorThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
}) => {
  const { resolvedTheme } = useTheme();
  const [theme, setTheme] = useState<Theme | null>(
    resolvedTheme === "dark" ? defaultThemes.dark : defaultThemes.light
  );

  // On mount, set the default theme
  useEffect(() => {
    if (resolvedTheme === "dark") {
      setTheme(defaultThemes.dark);
    } else {
      setTheme(defaultThemes.light);
    }
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
      console.warn("Cannot set default themes as custom themes.");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setCustomTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
