import EditorComponent from "@/components/editor";
import "@/app/globals.css";

export default function Editor() {
  return (
    <div className="flex flex-col h-full w-full max-h-screen">
      <EditorComponent />
    </div>
  );
}
