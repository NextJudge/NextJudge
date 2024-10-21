import { Theme, ThemeContext } from "@/providers/editor-theme";
import { loader } from "@monaco-editor/react";
import { useCallback, useContext, useLayoutEffect } from "react";

export const useEditorTheme = (
  defaultTheme: string | undefined,
  defaultColorScheme: Theme
) => {
  const { theme, setTheme } = useContext(ThemeContext);
  const onSelect = useCallback(
    (theme: Theme) => {
      setTheme(theme);
    },
    [theme]
  );

  // useLayoutEffect(() => {
  //   loader.init().then((monaco) => {
  //     monaco.editor.setTheme(defaultColorScheme.name!);
  //     onSelect(defaultColorScheme);
  //   });
  // }, [defaultTheme]);

  // useLayoutEffect(() => {
  //   loader.init().then((monaco) => {
  //     console.log("THEME", theme)
  //     if (theme) monaco.editor.setTheme(theme.name);
  //     onSelect(theme || defaultColorScheme);
  //   });
  // }, [theme]);

  return { theme, onSelect };
};
