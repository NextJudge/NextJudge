"use client";

import { apiGetLanguages } from "@/lib/api";
import { Language } from "@/lib/types";

export const FALLBACK_TYPESCRIPT: Language = {
  id: "typescript-fallback",
  name: "TypeScript",
  extension: "ts",
  version: "5.4.5",
};

const TIMEOUT_MS = 2000;

let languagesCache: Language[] | null = null;
let languagesPromise: Promise<Language[]> | null = null;
let languagesResource: { read: () => Language[] } | null = null;

const createLanguagesResource = (): { read: () => Language[] } => {
  if (languagesResource) {
    return languagesResource;
  }

  let status: "pending" | "success" | "error" | "timeout" = "pending";
  let result: Language[] | Error = [FALLBACK_TYPESCRIPT];
  let timeoutId: NodeJS.Timeout | null = null;
  let hasTimedOut = false;

  timeoutId = setTimeout(() => {
    if (status === "pending" && !languagesCache) {
      hasTimedOut = true;
      status = "timeout";
      result = [FALLBACK_TYPESCRIPT];
    }
  }, TIMEOUT_MS);

  const promise = apiGetLanguages()
    .then((langs) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      languagesCache = langs;
      if (hasTimedOut) {
        status = "success";
        result = langs;
        if (languagesResource) {
          languagesResource = {
            read() {
              return langs;
            },
          };
        }
      } else {
        status = "success";
        result = langs;
      }
      languagesPromise = null;
    })
    .catch((error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (!hasTimedOut) {
        status = "error";
        result = error;
        languagesPromise = null;
      }
    });

  languagesPromise = promise;

  languagesResource = {
    read() {
      if (status === "pending") {
        throw promise;
      }
      if (status === "error") {
        throw result;
      }
      return result as Language[];
    },
  };

  return languagesResource;
};

export const getLanguagesResource = (): { read: () => Language[] } => {
  if (languagesCache) {
    return {
      read() {
        return languagesCache!;
      },
    };
  }
  return createLanguagesResource();
};
