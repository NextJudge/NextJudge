/* eslint-disable @typescript-eslint/no-explicit-any */
import "@/styles/index.css";

import { useLayoutEffect, useRef, useState } from "react";
import Editor, { loader, useMonaco } from "@monaco-editor/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCollapse } from "react-collapsed";
import Split from "react-split";

function EditorComponent() {
  const editorRef = useRef<any>();
  const monaco = useMonaco();
  const languages = monaco?.languages.getLanguages();
  const [isExpanded, setExpanded] = useState(true);
  const { getCollapseProps, getToggleProps } = useCollapse({ isExpanded });
  const [submissionStatus, setSubmissionStatus] = useState("Loading");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");

  useLayoutEffect(() => {
    loader.init().then((monaco) => {
      monaco.editor.defineTheme("myTheme", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#000000",
        },
      });
    });
  }, []);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  // async function showValue() {
  //     console.log(editorRef.current.getValue());
  // }

  async function submitCode() {
    const code = editorRef.current.getValue();
    const language = selectedLanguage;
    const problemId = "1";

    const submission = {
      type: "submission",
      code: code,
      lang: language,
      problemId: problemId,
    };
      console.log(languages);
      console.log("Submission:", submission);
  }
  
  const [code, setCode] = useState(`/**
    * @param {string}
    * @return {boolean}
    */

    var isPathCrossing = function(path) {
        let x = 0;
        let y = 0;
        const set = new Set();
        set.add(x + "," + y);
        for (let i = 0; i < path.length; i++) {
            if (path[i] === "N") {
                y++;
            } else if (path[i] === "S") {
                y--;
            } else if (path[i] === "E") {
                x++;
            } else if (path[i] === "W") {
                x--;
            }
            if (set.has(x + "," + y)) {
                return true;
            }
            set.add(x + "," + y);
        }
        return false;
    };`);


  const handleCodeChange = (ev: any) => {
    setCode(ev.target.value);
  };

  return (
    <>
      <Split
        sizes={[25, 75]}
        minSize={450}
        maxSize={1000}
        expandToMin={false}
        gutterSize={20}
        className="split"
        direction="horizontal"
      >
        <div className="panel sum max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <h2 className="mb-2 text-xl font-bold">1496. Path Crossing</h2>
          <h3 className="mb-1 text-lg">Difficulty: Easy</h3>
          <p className="text-sm">
            Given a string path, where path[i] = 'N', 'S', 'E' or 'W', each
            representing moving one unit north, south, east, or west,
            respectively. You start at the origin (0, 0) on a 2D plane and walk
            on the path specified by path.
          </p>
          <p className="text-sm">
            Return true if the path crosses itself at any point, that is, if at
            any time you are on a location you have previously visited. Return
            false otherwise.
          </p>

          <h3>Visualization:</h3>

          <img
            src="https://s3-us-west-2.amazonaws.com/courses-images/wp-content/uploads/sites/2043/2017/07/01214432/IMG_Econ_01_011.png"
            alt="Visualization"
            className="mx-auto w-full max-w-sm object-contain"
          />

          <h3 className="mb-1 text-lg">Example 1:</h3>
          <p className="text-sm">
            Input: path = "NES"
            <br />
            Output: false
            <br />
            Explanation: Notice that the path doesn't cross any point more than
            once.
          </p>
          <h3 className="mb-1 text-lg">Example 2:</h3>
          <p className="text-sm">
            Input: path = "NESWW"
            <br />
            Output: true
            <br />
            Explanation: Notice that the path visits the origin twice.
          </p>
          <h3 className="mb-1 text-lg">Constraints:</h3>
          <p className="text-sm">
            {`1 <= path.length <= 104`}
            <br />
            {`path[i] is either 'N', 'S', 'E', or 'W'.`}
          </p>
        </div>
        <div className="panel mx-auto p-4">
          <Editor
            language={selectedLanguage}
            defaultLanguage="javascript"
            loading={<LoadingSkeleton />}
            theme="myTheme"
            value={code}
            className={`panel min-h-[calc(100vh-10rem)] min-w-[100%] rounded-md border-2 border-slate-600/25`}
            options={{
              formatOnPaste: true,
              formatOnType: true,
              fontSize: 14,
              cursorStyle: "line",
              cursorSmoothCaretAnimation: "on",
              cursorBlinking: "smooth",
              cursorWidth: 1,
              cursorSurroundingLines: 1,
              multiCursorModifier: "ctrlCmd",
              scrollBeyondLastLine: false,
            }}
            beforeMount={handleEditorDidMount}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
          />
          <div className="flex w-full flex-row justify-between space-x-4  rounded-md border-2 border-slate-600/25 px-12 text-center">
            <button
              className="p-4"
              {...getToggleProps({
                onClick: () => setExpanded((prevExpanded) => !prevExpanded),
              })}
            >
              {isExpanded ? <ChevronDown /> : <ChevronUp />}
            </button>

            <div
              {...getCollapseProps()}
              className="flex flex-col items-center justify-center gap-2 align-middle"
            >
              <h3 className="text-center text-lg font-bold">
                Submission Status
              </h3>
              {submissionStatus === "AC" && (
                <div className="flex flex-row items-center space-x-2">
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                  <p className="text-sm">Accepted</p>
                </div>
              )}
              {submissionStatus === "WA" && (
                <div className=" flex flex-row items-center space-x-2">
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                  <p className="text-sm">Wrong Answer</p>
                </div>
              )}
              {submissionStatus === "Loading" && (
                <div className=" flex flex-row items-center space-x-2">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-blue-500"></div>
                  <p className="text-sm">Loading...</p>
                </div>
              )}
            </div>

            <div
              {...getCollapseProps()}
              className="flex flex-col items-center justify-center gap-2 align-middle"
            >
              <h3 className="text-lg font-bold">Languages</h3>
              <select
                className="rounded px-4 py-2 font-bold
                 text-black sm:w-40 md:w-48 md:px-6 md:py-2 md:text-lg lg:w-56 xl:w-64"
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {languages?.map((language) => (
                  <option value={language.id}>{language.id}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center gap-12 space-y-4 align-middle">
              <button
                onClick={submitCode}
                className="rounded border-2 border-slate-500 bg-blue-500 px-4 py-2 font-bold text-black hover:bg-blue-600 sm:w-40 md:w-48 md:px-6 md:py-2 md:text-lg lg:w-56 xl:w-64"
              >
                Submit Code
              </button>
            </div>
          </div>
        </div>
      </Split>
    </>
  );
}

const LoadingSkeleton = () => {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] w-full flex-row items-center justify-center gap-2">
      <div className="h-4 w-4 animate-pulse rounded-full bg-blue-500"></div>
      <div className="h-4 w-4 animate-pulse rounded-full bg-blue-500"></div>
      <div className="h-4 w-4 animate-pulse rounded-full bg-blue-500"></div>
      <div className="h-4 w-4 animate-pulse rounded-full bg-blue-500"></div>
    </div>
  );
};

export default EditorComponent;
