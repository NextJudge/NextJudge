import { t } from "elysia";

export const userSwaggerTags = { detail: { tags: ["USERSs"] } };

export const createUserHook = {
  ...userSwaggerTags,
  body: t.Object({ username: t.String(), password: t.String() }),
};

export const loginUsersHook = {
  ...userSwaggerTags,
  body: t.Object({ username: t.String(), password: t.String() }),
};

export const getUsersHook = {
  ...userSwaggerTags,
};
