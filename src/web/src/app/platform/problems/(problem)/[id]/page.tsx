import EditorComponent from "@/components/editor/editor";
import EditorNavbar from "@/components/editor/editor-nav";

import { EditorThemeProvider } from "@/providers/editor-theme";

// TODO: Move all the logic & state to Zustand (global state solution)
export default function Editor() {
  return (
    <>
      <EditorThemeProvider>
        <EditorNavbar />
        <EditorComponent />
      </EditorThemeProvider>
    </>
  );
}
