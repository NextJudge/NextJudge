import getLanguages from "@controllers/languages";
import { getLanguagesHook } from "@hooks/users";
import { Elysia } from "elysia";

const availableLangsEndpoint = new Elysia().get(
  "/languages",
  getLanguages,
  getLanguagesHook
);

export default availableLangsEndpoint;
