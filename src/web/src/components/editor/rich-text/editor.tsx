import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import EditorToolbar from "./toolbar/editor-toolbar";
import { Mathematics } from "@tiptap-pro/extension-mathematics";
import "katex/dist/katex.min.css";
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
    extensions: [StarterKit, Mathematics],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return <></>;

  return (
    <div className="prose max-w-none w-full border border-input bg-background dark:prose-invert">
      <EditorToolbar editor={editor} />
      <div className="editor">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
};

export default Editor;
