import { Elysia } from "elysia";
import userEndpoints from "./users";

const userRouter = new Elysia().use(userEndpoints);

export { userRouter };
