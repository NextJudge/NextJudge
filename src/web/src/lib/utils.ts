import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Language } from "./types";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getBridgeUrl() {
    return process.env.NODE_ENV === "production"
        ? "https://api.nextjudge.net"
        : "http://localhost:5000";
}

export function getAppUrl() {
    return process.env.NODE_ENV === "production"
        ? "https://nextjudge.net"
        : "http://localhost:8080";
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
