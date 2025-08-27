import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Mathematics } from "@tiptap-pro/extension-mathematics";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "katex/dist/katex.min.css";
import { useCallback } from "react";
import { Markdown } from "tiptap-markdown";
import "./styles.scss";
import EditorToolbar from "./toolbar/editor-toolbar";

interface EditorProps {
  content: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

Mathematics.configure({
  shouldRender: (state, pos, node) => {
    const $pos = state.doc.resolve(pos);
    return node.type.name === "text" && $pos.parent.type.name !== "codeBlock";
  },
});

const Editor = ({ content, placeholder, onChange }: EditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit, Mathematics, Markdown],
    content: content,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
  });

  const toggleEditing = useCallback(
    (e: CheckedState) => {
      if (!editor) return;
      const checked = e;
      editor.setEditable(!checked, true);
      editor.view.dispatch(editor.view.state.tr.scrollIntoView());
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  return (
    <>
      <div className="flex flex-row justify-center float-right gap-4">
        <Label htmlFor="editor">Readonly</Label>
        <Checkbox
          checked={!editor.isEditable}
          onCheckedChange={toggleEditing}
        />
      </div>
      <div className="prose max-w-none w-full border border-input bg-background dark:prose-invert">
        <EditorToolbar editor={editor} />
        <div className="editor">
          <EditorContent editor={editor} placeholder={placeholder} />
        </div>
      </div>
    </>
  );
};

export default Editor;
