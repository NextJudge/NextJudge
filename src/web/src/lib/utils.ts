import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBridgeUrl() {
  console.log(process.env.NODE_ENV);
  return process.env.NODE_ENV === "production"
    ? "https://nextjudge.org"
    : "http://localhost:5000";
}
