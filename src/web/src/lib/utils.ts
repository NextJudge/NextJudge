import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Language } from "./types";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getBridgeUrl() {
    return "http://localhost:5000"
    console.log(process.env.NODE_ENV);
    return process.env.NODE_ENV === "production"
        ? "https://nextjudge.org"
        : "http://localhost:5000";
}


export function convertToMonacoLanguageName(language: Language | undefined) {
    return language?.name === "pypy"
        ? "python"
        : language?.name === "c++"
            ? "cpp"
            : language?.name
}
