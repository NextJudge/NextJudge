import EditorComponent from "@/components/editor";

import "@/styles/layout.css";

import { useState } from "react";

export function Navbar({ fixed }: { fixed: boolean }) {
  const [navbarOpen, setNavbarOpen] = useState(false);
  return (
    <>
      <nav className="relative mb-3 flex flex-wrap items-center justify-between rounded-lg bg-gray-950/60 px-2 py-3 backdrop-blur-md">
        <div className="container mx-auto flex flex-wrap items-center justify-between px-4">
          <div className="relative flex w-full justify-between lg:static lg:block lg:w-auto lg:justify-start">
            <a
              className="mr-4 inline-block whitespace-nowrap text-xl font-bold uppercase leading-relaxed text-white"
              href="/"
            >
              NextJudge
            </a>
            <button
              className="block cursor-pointer rounded border border-solid border-transparent bg-transparent px-3 py-1 text-xl leading-none text-white outline-none focus:outline-none lg:hidden"
              type="button"
              onClick={() => setNavbarOpen(!navbarOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
          <div
            className={
              "flex-grow items-center lg:flex" +
              (navbarOpen ? " flex" : " hidden")
            }
            id="example-navbar-danger"
          >
            <ul className="flex list-none flex-col lg:ml-auto lg:flex-row">
              <li className="nav-item">
                <a
                  className="flex items-center px-3 py-2 text-xs font-bold uppercase leading-snug text-white hover:opacity-75"
                  href="/contests"
                >
                  <i className="fab fa-facebook-square leading-lg text-lg text-white opacity-75"></i>
                  <span className="ml-2">Contests</span>
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="flex items-center px-3 py-2 text-xs font-bold uppercase leading-snug text-white hover:opacity-75"
                  href="/problems"
                >
                  <i className="fab fa-twitter leading-lg text-lg text-white opacity-75"></i>
                  <span className="ml-2">Problemset</span>
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="flex items-center px-3 py-2 text-xs font-bold uppercase leading-snug text-white hover:opacity-75"
                  href="/stats"
                >
                  <i className="fab fa-pinterest leading-lg text-lg text-white opacity-75"></i>
                  <span className="ml-2">Stats</span>
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="flex items-center px-3 py-2 text-xs font-bold uppercase leading-snug text-white hover:opacity-75"
                  href="/account"
                >
                  <i className="fab fa-pinterest leading-lg text-lg text-white opacity-75"></i>
                  <span className="ml-2">Account</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

export default function Problem() {
  return (
    <div className="layout h-screen w-full overflow-y-scroll bg-black bg-fixed text-white selection:bg-white selection:text-black">
      <Navbar fixed={true} />
      <EditorComponent />
    </div>
  );
}
