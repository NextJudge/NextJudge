import bearer from "@elysiajs/bearer";
import { t } from "elysia";

export const userSwaggerTags = { detail: { tags: ["USERSs"] } };

export const createUserHook = {
  ...userSwaggerTags,
  body: t.Object({
    username: t.String(),
    password: t.String(),
    isAdmin: t.Boolean(),
  }),
};

export const loginUsersHook = {
  ...userSwaggerTags,
  body: t.Object({ username: t.String(), password: t.String() }),
};

export const getUsersHook = {
  ...userSwaggerTags,
};

export const createSubmissionHook = {
  ...userSwaggerTags,
  body: t.Object({
    user_id: t.String(),
    language_id: t.String(),
    problem_id: t.Integer(),
    source_code: t.String(),
  }),
  // bearer: bearer,
};



export const getLanguagesHook = {
  ...userSwaggerTags,
};
