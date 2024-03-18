"use client";
import EditorComponent from "@/components/editor";
import EditorNavbar from "@/components/editor-nav";
import RemoteMdxPage from "@/components/remote-mdx";
import { EditorThemeProvider } from "@/providers/editor-theme";

// TODO: Move all the logic & state to Zustand (global state solution)
export default function Editor() {
  return (
    <>
      <EditorThemeProvider>
        <EditorNavbar />
        <EditorComponent>
          <RemoteMdxPage />
        </EditorComponent>
      </EditorThemeProvider>
    </>
  );
}
