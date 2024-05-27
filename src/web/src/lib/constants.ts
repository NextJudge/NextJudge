import { editor } from "monaco-editor";
import { Language } from "../types/index";
export const sidebarNavItems = [
  {
    title: "Profile",
    href: "/platform/admin",
  },
  {
    title: "Problems",
    href: "/platform/admin/problems",
  },
  {
    title: "Contests",
    href: "/platform/admin/contests",
  },
];

export const links = [
  {
    label: "Admin",
    href: "/platform/admin",
    dropdown: true,
    dropdownLinks: [
      {
        label: "Profile",
        href: "/platform/admin",
      },
      {
        label: "Problems",
        href: "/platform/admin/problems",
      },
      {
        label: "Contests",
        href: "/platform/admin/contests",
      },
    ],
  },
];

export const directoryRoutes = {
  infosNav: [
    {
      title: "Directory",
      items: [
        {
          title: "Recent Submissions",
          href: "/platform/problems#submissions",
          description: "Tried submitting a solution? Here's your latest.",
        },
        {
          title: "Editorials",
          href: "/platform/editorials",
          description: "Read the editorials for the problems.",
        },
        {
          title: "Logout",
          href: "/auth/logout",
          description: "Done using NextJudge? Logout here.",
        },
      ],
    },
  ],
};

interface RouteProps {
  href: string;
  label: string;
}

export const routeList: RouteProps[] = [
  {
    href: "/",
    label: "Docs",
  },
  {
    href: "/#services",
    label: "Services",
  },
  {
    href: "/#features",
    label: "Features",
  },
  {
    href: "/#early-access",
    label: "Early Access",
  },
  {
    href: "/#faq",
    label: "FAQ",
  },
];

export const platformRoutes: RouteProps[] = [
  {
    href: "/platform",
    label: "Home",
  },
  {
    href: "/platform/contests",
    label: "Contests",
  },
  {
    href: "/platform/problems",
    label: "Problems",
  },
  {
    href: "/platform/admin",
    label: "Admin",
  },
];

export const defaultEditorOptions: editor.IStandaloneEditorConstructionOptions =
  {
    formatOnPaste: true,
    formatOnType: true,
    showUnused: true,
    fontSize: 14,
    cursorStyle: "line",
    cursorSmoothCaretAnimation: "on",
    cursorBlinking: "smooth",
    cursorWidth: 1,
    cursorSurroundingLines: 1,
    multiCursorModifier: "ctrlCmd",
    scrollBeyondLastLine: true,
  };

export const languages: Language[] = [
  {
    id: 1,
    name: "C",
    extension: ".c",
    version: "13.2.0",
  },
  {
    id: 2,
    name: "C++",
    extension: ".cpp",
    version: "13.2.0",
  },
  {
    id: 3,
    name: "PyPy",
    extension: ".py",
    version: "3.9.18 (7.3.15)",
  },
  {
    id: 4,
    name: "Python",
    extension: ".py",
    version: "3.12.3",
  },
  {
    id: 5,
    name: "Rust",
    extension: ".rs",
    version: "1.78.0",
  },
  {
    id: 6,
    name: "Go",
    extension: ".go",
    version: "1.22.1",
  },
  {
    id: 7,
    name: "JavaScript",
    extension: ".js",
    version: "21.6.2",
  },
  {
    id: 8,
    name: "TypeScript",
    extension: ".ts",
    version: "5.4.5",
  },
  {
    id: 9,
    name: "Java",
    extension: ".java",
    version: "21.0.3",
  },
  {
    id: 10,
    name: "Kotlin",
    extension: ".kt",
    version: "1.9.24",
  },
  {
    id: 11,
    name: "Ruby",
    extension: ".rb",
    version: "3.2.3",
  },
  {
    id: 12,
    name: "Haskell",
    extension: ".hs",
    version: "9.4.7",
  },
  {
    id: 13,
    name: "Lua",
    extension: ".lua",
    version: "5.4.6",
  },
];

export const defaultLanguage = languages[3];
