import EditorComponent from "@/components/editor/editor-layout";
import EditorNavbar from "@/components/editor/editor-nav";
import UserAvatar from "@/components/nav/user-avatar";
import { EditorThemeProvider } from "@/providers/editor-theme";

export default function Editor() {
  return (
    <>
      <EditorThemeProvider>
        <EditorNavbar>
          <UserAvatar />
        </EditorNavbar>
        <EditorComponent />
      </EditorThemeProvider>
    </>
  );
}
