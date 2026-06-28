import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  getPreviewApiUrlFromWebHostname,
  getPreviewWebUrlFromHostname,
  SITE_URLS,
} from "./site";
import { Language } from "./types";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type UrlOptions = { hostname?: string };

const isLocalHostname = (url: string): boolean => {
    try {
        const { hostname } = new URL(url);
        return hostname === "localhost" || hostname === "127.0.0.1";
    } catch {
        return false;
    }
};

const isRunningLocally = (): boolean => {
    if (process.env.NODE_ENV === "development") {
        return true;
    }

    const appUrl = process.env.NEXTAUTH_URL?.trim() ?? process.env.AUTH_URL?.trim();
    if (appUrl && isLocalHostname(appUrl)) {
        return true;
    }

    return false;
};

const getConfiguredApiUrl = (): string | undefined => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (apiUrl) {
        return apiUrl;
    }

    const legacyBridgeUrl = process.env.NEXT_PUBLIC_VERCEL_BRIDGE_URL?.trim();
    if (legacyBridgeUrl) {
        return legacyBridgeUrl;
    }

    return undefined;
};

const resolveHostname = (hostname?: string): string | undefined => {
    if (hostname) {
        return hostname.split(":")[0];
    }
    if (typeof window !== "undefined") {
        return window.location.hostname;
    }
    return undefined;
};

export function getBridgeUrl(options?: UrlOptions): string {
    const host = resolveHostname(options?.hostname);
    if (host) {
        const previewApi = getPreviewApiUrlFromWebHostname(host);
        if (previewApi) {
            return previewApi;
        }
    }

    const apiOverride = getConfiguredApiUrl();

    if (isRunningLocally()) {
        if (apiOverride && isLocalHostname(apiOverride)) {
            return apiOverride;
        }
        return SITE_URLS.development.api;
    }

    if (apiOverride) {
        return apiOverride;
    }

    return SITE_URLS.production.api;
}

export function getAppUrl(options?: UrlOptions): string {
    const host = resolveHostname(options?.hostname);
    if (host) {
        const previewApp = getPreviewWebUrlFromHostname(host);
        if (previewApp) {
            return previewApp;
        }
    }

    const authUrl = process.env.NEXTAUTH_URL?.trim() ?? process.env.AUTH_URL?.trim();
    if (authUrl) {
        try {
            const origin = new URL(authUrl).origin;
            if (isLocalHostname(authUrl) || !isRunningLocally()) {
                return origin;
            }
        } catch {
            // fall through to defaults
        }
    }

    if (isRunningLocally()) {
        return SITE_URLS.development.app;
    }

    return SITE_URLS.production.app;
}


export function convertToMonacoLanguageName(language: Language | undefined) {
    if (!language) return "typescript";

    if (language.name === "pypy") {
        return "python";
    }
    if (language.name === "c++") {
        return "cpp";
    }
    if (language.id === "typescript-fallback" || language.name.toLowerCase() === "typescript") {
        return "typescript";
    }

    return language.name.toLowerCase();
}

export function compareOutput(expected: string, actual: string): boolean {
    const expectedLines = expected.trim().split("\n").map((line) => line.trim());
    const actualLines = actual.trim().split("\n").map((line) => line.trim());

    if (expectedLines.length !== actualLines.length) {
        return false;
    }

    for (let i = 0; i < expectedLines.length; i++) {
        if (expectedLines[i] !== actualLines[i]) {
            return false;
        }
    }

    return true;
}
