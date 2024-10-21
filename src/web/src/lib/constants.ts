import { editor } from "monaco-editor";
import { Language } from "@/lib/types";
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
