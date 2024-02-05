import { Elysia } from "elysia";
import { createUser, getUsers, loginUser } from "../controllers/users";
import {
  createUserHook,
  loginUsersHook,
  userSwaggerTags,
} from "../hooks/users";

const userEndpoints = new Elysia()
  .post("/login", loginUser, loginUsersHook)
  .derive(({ headers }) => {
    const auth = headers["authorization"];

    if (!auth) {
      throw new Error("Unauthorized");
    }

    const token = auth.split(" ")[1];

    if (!token) {
      throw new Error("Unauthorized");
    }

    return {
      bearer: token,
    };
  })
  .get("/users", getUsers, userSwaggerTags)
  .post("/users", createUser, createUserHook);

export default userEndpoints;
