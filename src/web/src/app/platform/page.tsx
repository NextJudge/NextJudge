"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCollapse } from "react-collapsed";
import Split from "react-split";
import "../globals.css";
import KatexSpan from "@/components/katex-wrapper";
import { Button } from "@/components/ui/button";
import Latex from "react-latex";

const problemStatement = `
1.

Given an array of integers, return indices of the two numbers such that they add up to a specific target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:

Given nums = [2, 7, 11, 15], target = 9,

Because nums[0] + nums[1] = 2 + 7 = 9,
return [0, 1].
`;

const problemStatementKaTeX = `
\problem[5.3.8 (5pts)]

Show that $\lambda \geq 0$ for the eigenvalue problem

\[ \diff[2]{\h}{x} + \left( \l - x^2 \right)\h = 0
\mtxt{with}
\diff{\h}{x}(0)=0 \mc \diff{\h}{x}(1)=0. \]

Is $\lambda = 0$ an eigenvalue?


\solution{

The Rayleigh quotient is

\begin{formula}[Rayleigh Quotient]
		\lambda = \frac{\eval{-p(x) \phi(x)\phi'(x)}{a}{b} + \Int{p(x) [\phi'(x)]^2 - q(x) [\phi(x)]^2}{a}{b}}{\Int{[\phi(x)]^2\sigma(x)}{a}{b}}.
\end{formula}

With $p=1$, $q=-x^2$, and $\sigma=1$, the boundary conditions imply
$\eval{-\h\h'}{0}{1}=0$,
so our eigenvalues must satisfy

\begin{equation*}
	\lambda
  = \frac{ \eval{-\phi \phi'}{0}{1}
    + \Int{[\phi']^2 + x^2 \phi^2}{0}{1} }{\Int{\phi^2}{0}{1}}
	= \frac{ \Int{[\phi']^2}{0}{1}
    + \Int{[x\phi]^2}{0}{1} }{\Int{\phi^2}{0}{1}}
	\geq 0.
\end{equation*}

Furthermore, if $\lambda = 0$ then $\Int{[\phi']^2}{0}{1} = - \Int{[x\phi]^2}{0}{1}$. That is possible only if $\phi'(x)\equiv0$, which in turn implies that $\phi(x)\equiv c$ for some constant $c$.

From the boundary conditions, it must be the case that $c=0$. But this would indicate a trivial solution, and thus $\lambda \neq 0$. So there is no zero eigenvalue.
}
`;
const BRIDGE_ENDPOINT = `http://localhost:8080/api/v1`;

console.log("BRIDGE_ENDPOINT");
console.log(BRIDGE_ENDPOINT);

export default function EditorComponent() {
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
  const editorRef = useRef<any>();
  const [languages, setLanguages] = useState<any>([]);
  const [isExpanded, setExpanded] = useState(true);
  const [submissionId, setSubmissionId] = useState(0);

  const { getCollapseProps, getToggleProps } = useCollapse({ isExpanded });
  const [submissionStatus, setSubmissionStatus] = useState("Loading");
  const supportedLanguages = [
    { language: "C++", extension: "cpp" },
    { language: "Python", extension: "py" },
    { language: "Go", extension: "go" },
    { language: "Java", extension: "java" },
    { language: "Node", extension: "ts" },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState("cpp");

  // const supportedLangs = languages?.filter((lang: any) => {
  //   return supportedLanguages.some((supportedLang) => {
  //     if (supportedLang.language === "Node") {
  //       return lang.id === "typescript" || lang.id === "javascript";
  //     }
  //     return lang.id === supportedLang.language.toLowerCase();
  //   });
  // });

  const supportedLangs = ["cpp"];

  async function fetch_submission() {}

  useEffect(() => {
    fetch_submission();
  }, []);

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
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(`${BRIDGE_ENDPOINT}/languages`, {
          method: "GET",
          // headers: {
          // "Content-Type": "application/json",
          //  This is temporary, for testing.
          // Authorization: `Bearer ${localStorage.getItem("token")}`,
          // },
        });

        if (!response.ok) {
          console.log("Error in response", response.status);
          throw "error";
        }

        const data = await response.json();
        console.log(data);

        if (response.status === 200) {
          setLanguages(data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchLanguages();
  }, []);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  // async function showValue() {
  //     console.log(editorRef.current.getValue());
  // }

  const mapLanguage = (lang: string) => {
    console.log(lang);
    if (lang === "javascript" || lang === "typescript") {
      return "Node";
    } else if (lang === "go") {
      return "Go";
    } else if (lang === "java") {
      return "Java";
    } else if (lang === "cpp") {
      return "C++";
    } else if (lang === "python") {
      return "Python";
    } else {
      return "Node";
    }
  };

  async function submitCode() {
    const code: string = editorRef.current.getValue();
    const problemId = 1;
    const submission = {
      user_id: 1,
      source_code: code,
      language: mapLanguage(selectedLanguage),
      problem_id: problemId,
    };

    const body_payload = JSON.stringify(submission);

    console.log("Sending submission");
    console.log(submission);
    console.log(body_payload);

    const response = await fetch(`${BRIDGE_ENDPOINT}/submission`, {
      method: "POST",
      body: body_payload,
      headers: {
        "Content-Type": "application/json",
        //  This is temporary, for testing.
        // Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      console.log("Error in response", response.status);
      return;
    }

    const data = await response.text();
    console.log("SUVMISSION ID GOT", +data);
    setSubmissionId(+data);

    console.log("Submission:", submission);

    return "hi";
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      console.log(submissionId);
      if (submissionId === 0) {
        return;
      }

      try {
        const response = await fetch(
          `${BRIDGE_ENDPOINT}/submission/${submissionId}`,
          {
            method: "GET",
          }
        );

        const data = await response.json();
        console.log(data);

        if (data.status !== "") {
          clearInterval(interval);
        }

        setSubmissionStatus(data.status);
      } catch (e) {
        console.error("error", e);
      }
    }, 1000);

    if (submissionId === 0) {
      clearInterval(interval);
      return;
    }
  }, [submissionId]);

  const handleCodeChange = (ev: any) => {
    setCode(ev.target.value);
  };

  return (
    <>
      <Split
        sizes={[20, 90]}
        minSize={450}
        maxSize={1000}
        expandToMin={false}
        gutterSize={20}
        className="split"
        direction="horizontal"
      >
        <div className="panel sum max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <Latex displayMode={true}>{problemStatementKaTeX}</Latex>
        </div>
        <div className="panel mx-auto p-4">
          <Editor
            language={"cpp"}
            defaultLanguage="cpp"
            loading={<div>Loading...</div>}
            theme="light"
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
              <h3 className="text-lg font-bold">Languages</h3>
              <select
                className="rounded px-4 py-2 font-bold
                     text-black sm:w-40 md:w-48 md:px-6 md:py-2 md:text-lg lg:w-56 xl:w-64"
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value={selectedLanguage}>{selectedLanguage}</option>
                {supportedLangs?.map((lang: any) => {
                  if (lang.id === selectedLanguage) {
                    return null;
                  }
                  return (
                    <option key={lang.id} value={lang.id}>
                      {lang.id}
                    </option>
                  );
                })}
              </select>
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
                <option value={selectedLanguage}>{selectedLanguage}</option>
                {supportedLangs?.map((lang: any) => {
                  if (lang.id === selectedLanguage) {
                    return null;
                  }
                  return (
                    <option key={lang.id} value={lang.id}>
                      {lang.id}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center gap-12 space-y-4 align-middle">
              <Button onClick={submitCode}>Submit</Button>
            </div>
          </div>
        </div>
      </Split>
    </>
  );
}
