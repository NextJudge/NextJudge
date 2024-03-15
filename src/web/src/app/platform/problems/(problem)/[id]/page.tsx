"use client";
import EditorComponent from "@/components/editor";
import { type Theme } from "@/components/editor-combo";
import EditorNavbar from "@/components/editor-nav";
import { loader } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useCallback, useLayoutEffect, useState } from "react";

// TODO: Move all the logic & state to Zustand (global state solution)
export default function Editor() {
  const { resolvedTheme } = useTheme();
  const darkDefault: Theme = {
    name: "brilliance-black",
    fetch: "/themes/Brilliance Black.json",
  };
  const lightDefault: Theme = {
    name: "github-light",
    fetch: "/themes/GitHub Light.json".replace(" ", "%20"),
  };
  const defaultColorScheme =
    resolvedTheme === "dark" ? darkDefault : lightDefault;
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(
    defaultColorScheme
  );
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const onSelect = useCallback((theme: Theme) => {
    setSelectedTheme(theme);
  }, []);
  const getThemes = async () => {
    const themeList = await import(
      "../../../../../../public/themelist.json"
    ).then((res) => {
      return Object.keys(res).map((theme) => ({
        name: theme,
        fetch: `/themes/${res[theme]}.json`,
      }));
    });
    return themeList;
  };

  const getColorScheme = () => {
    switch (resolvedTheme) {
      case "dark":
        return darkDefault.name;
      case "light":
        return lightDefault.name;
      default:
        return selectedTheme?.name;
    }
  };

  useLayoutEffect(() => {
    if (selectedTheme?.name !== getColorScheme() && selectedTheme) {
      (async () => {
        fetch(selectedTheme.fetch).then(async (response) => {
          const data = await response.json();
          //   console.log(data, "This is the data");
          loader.init().then((monaco) => {
            monaco.editor.defineTheme(selectedTheme.name!, {
              ...data,
            });
            monaco.editor.setTheme(selectedTheme.name!);
            onSelect(selectedTheme);
            setIsThemeLoaded(true);
          });
        });
      })();
    }
  }, [selectedTheme]);

  useLayoutEffect(() => {
    (async () => {
      fetch(defaultColorScheme.fetch).then(async (response) => {
        const data = await response.json();
        loader.init().then((monaco) => {
          monaco.editor.defineTheme(defaultColorScheme.name!, {
            ...data,
          });
          monaco.editor.setTheme(defaultColorScheme.name!);
          onSelect(defaultColorScheme);
          setIsThemeLoaded(true);
        });
      });
    })();
  }, [resolvedTheme]);

  useLayoutEffect(() => {
    getThemes().then((res) => {
      setThemes(res);
    });
  }, []);

  return (
    <>
      <EditorNavbar
        themes={themes}
        onSelect={onSelect}
        selectedTheme={selectedTheme}
      />

      <EditorComponent
        themes={themes}
        onSelect={onSelect}
        selectedTheme={selectedTheme}
        isThemeLoaded={isThemeLoaded}
        setIsThemeLoaded={setIsThemeLoaded}
      />
    </>
  );
}
