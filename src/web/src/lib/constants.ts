import { SITE_URLS } from "@/lib/site";
import { editor } from "monaco-editor";
export const sidebarNavItems = [
  {
    title: "Overview",
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

export const settingsNavItems = [
  {
    title: "General",
    href: "/platform/settings",
  },
];

export const links = [
  {
    label: "Admin",
    href: "/platform/admin",
    dropdown: true,
    dropdownLinks: [
      {
        label: "Overview",
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

export const settingsLinks = [
  {
    label: "Settings",
    href: "/platform/settings",
    dropdown: true,
    dropdownLinks: [
      {
        label: "General",
        href: "/platform/settings",
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
          description: "Editorials are coming soon. Browse problems in the meantime.",
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
    href: "/team",
    label: "The Team",
  },
  {
    href: "/#try-it",
    label: "Demo",
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
    href: SITE_URLS.production.docs,
    label: "Docs",
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
