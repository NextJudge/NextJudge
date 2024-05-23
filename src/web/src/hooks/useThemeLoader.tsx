import { Theme } from "@/types";
import { loader } from "@monaco-editor/react";
import { useEffect, useState } from "react";

interface ThemeList {
  default: {
    [key: string]: string;
  };
}

export const useThemesLoader = (): {
  themes: Theme[];
  loading: boolean;
} => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const importCustomThemes = async () => {
    try {
      const themeListData: ThemeList = await import(
        "../../public/themelist.json"
      );
      const themeList = Object.keys(themeListData.default).map((theme) => ({
        name: theme,
        fetch: `/themes/${themeListData.default[theme]}.json`,
      }));

      setThemes(themeList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching themes:", error);
    }
  };
  const defineCustomThemes = async () => {
    const promises = [];
    for (const theme of themes) {
      promises.push(
        fetch(theme.fetch).then(async (response) => {
          const data = await response.json();
          loader.init().then((monaco) => {
            monaco.editor.defineTheme(theme.name, {
              ...data,
            });
          });
        })
      );
    }
    await Promise.all(promises);
  };

  useEffect(() => {
    importCustomThemes();
  }, []);

  useEffect(() => {
    if (themes.length > 0) {
      defineCustomThemes();
    }
  }, [themes]);

  return { themes, loading };
};
