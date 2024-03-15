// @ts-nocheck
"use client";
import { Editor } from "@monaco-editor/react";
import { useCallback, useEffect, useState } from "react";

type Theme = {
  name: string;
  fetch: string;
};

export function ThemeSelector({ handleThemeChange }: any) {
  const [content, setContent] = useState("// some code");
  const [isThemesLoaded, setIsThemesLoaded] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("vs-dark");
  const [themes, setThemes] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const response = await fetch(
        "http://localhost:3000/themes/themelist.json"
      );
      const data = await response.json();
      const themes = Object.keys(data).map((theme) => ({
        name: theme,
        fetch: data[theme],
      }));
      setThemes(themes);
    })();
  }, []);

  useEffect(() => {
    if (themes.length > 0) {
      setIsThemesLoaded(true);
    }
  }, [themes]);

  return (
    <div>
      <select onChange={handleThemeChange}>
        {themes.map((theme) => (
          <option key={theme.name} value={theme.name}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
}
