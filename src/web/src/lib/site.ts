export const BRAND_NAME = "NextJudge" as const;

export const SITE_COPY = {
  tagline: "Host Competitive Programming Contests with Ease",
  taglineLowercase: "Host competitive programming contests with ease",
  description:
    "NextJudge is a competitive programming platform built for the modern era. It is designed to be easy to use, fast, and extensible for everyone.",
  descriptionShort:
    "NextJudge is a competitive programming platform built for the modern era. It is designed to be easy to use, fast, and extensible.",
  platformDescription:
    "NextJudge is a platform for competitive programming, where you can solve problems and compete with others.",
  platformTagline: "Competitive Programming Platform",
  openGraphImageAlt: "NextJudge OpenGraph Image",
  logoAlt: "NextJudge Logo",
  footerIconAlt: "NextJudge Footer Icon",
  demoTitle: "NextJudge Demo",
  signInTitle: "Sign in to NextJudge",
  signUpCardDescription: "Sign up to get started with NextJudge",
  waitlistDescription:
    "Join the waitlist to get early access to NextJudge. We'll notify",
  logoutCardDescription: "Terminate your session with NextJudge",
  emailWelcomeTitle: "Welcome to the NextJudge Community",
  emailTeamSignature: "The NextJudge Team",
  docsAriaLabel: "NextJudge Documentation",
  navbarAriaLabel: "NextJudge",
  deleteAccountCardDescription:
    "Remove your login and profile. You will be signed out. Contest standings and shared content stay on the platform as Deleted user.",
  deleteAccountDialogCredentials:
    "This removes your login credentials and anonymizes your profile. You will be signed out immediately and cannot recover this account.",
  deleteAccountDialogStandings:
    "Your contest results stay on leaderboards as Deleted user—including live and past contests. Problems and submissions you shared remain for other participants.",
  deleteAccountDialogReRegister:
    "You can create a new account later with the same email or GitHub, but it will be a separate account. Past standings will not move to the new account.",
} as const;

export const COPYRIGHT = {
  year: 2026,
  allRightsReserved: "All rights reserved.",
} as const;

export const getCopyrightNotice = (
  year: number = COPYRIGHT.year,
): string => `© ${year} ${BRAND_NAME}. ${COPYRIGHT.allRightsReserved}`;

export const PAGE_TITLES = {
  default: `${BRAND_NAME} - ${SITE_COPY.tagline}`,
  home: `${BRAND_NAME} - ${SITE_COPY.taglineLowercase}`,
  platform: `${BRAND_NAME} - Platform`,
  problems: `${BRAND_NAME} - Problems`,
  editorials: `${BRAND_NAME} - Editorials`,
  adminProblems: `${BRAND_NAME} Admin - Problem Management`,
} as const;

export const PAGE_DESCRIPTIONS = {
  problems: "Our curated list of problems for you to solve.",
  editorials: "Editorials are coming soon. Browse and solve problems in the meantime.",
  adminProblems: `Manage the problems in the official ${BRAND_NAME} problem set.`,
} as const;

export const SITE_URLS = {
  production: {
    app: "https://nextjudge.net",
    api: "https://api.nextjudge.net",
    docs: "https://docs.nextjudge.net",
    docsGettingStarted: "https://docs.nextjudge.net/start/getting-started/",
    docsApiReference: "https://docs.nextjudge.net/reference/api/",
    github: "https://github.com/nextjudge",
    logo: "https://nextjudge.net/nextjudge.png",
    openGraphImage: "https://nextjudge.net/opengraph-image.webp",
  },
  development: {
    app: "http://localhost:8080",
    api: "http://localhost:5000",
  },
} as const;

export const EMAIL = {
  hello: "hello@nextjudge.net",
  dev: "dev@nextjudge.net",
} as const;

export const getContactEmail = (
  isProduction = process.env.NODE_ENV === "production",
): string => (isProduction ? EMAIL.hello : EMAIL.dev);

export const getMailto = (email: string): string => `mailto:${email}`;

export const getEmailFrom = (
  isProduction = process.env.NODE_ENV === "production",
): string => `${BRAND_NAME} <${getContactEmail(isProduction)}>`;

export const TWITTER = {
  creator: "@nextjudge",
} as const;

export const LOCALE = {
  openGraph: "en_US",
  countryName: "United States",
} as const;
