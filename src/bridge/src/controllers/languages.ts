import { LANG_TO_EXTENSION } from "@util/constants";

export default function getLanguages() {
  return Object.entries(LANG_TO_EXTENSION).map(([language, extension]) => ({
    language,
    extension,
  }));
}
