import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBridgeUrl() {
  return process.env.NEXT_PUBLIC_VERCEL_BRIDGE_URL ?
  process.env.NEXT_PUBLIC_VERCEL_BRIDGE_URL
    : `http://localhost:3000`
}

