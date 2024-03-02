import { LANG_TO_EXTENSION } from "@util/constants";

// TODO: reach out to datalayer for languages
export default function getLanguages() {
  return Object.entries(LANG_TO_EXTENSION).map(([language, extension]) => ({
    language,
    extension,
  }));
}
