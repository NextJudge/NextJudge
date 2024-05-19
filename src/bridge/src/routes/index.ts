import submissionEndpoints from "@routes/submissions";
import userEndpoints from "@routes/users";
import { Elysia } from "elysia";
import availableLangsEndpoint from "./languages";
import testcaseEndpoints from "./testcases";
import customSubmitEndpoint from "./custom_input";

const userRouter = new Elysia().use(userEndpoints);
const submissionsRouter = new Elysia().use(submissionEndpoints);
const languagesRouter = new Elysia().use(availableLangsEndpoint);
const testcaseRouter = new Elysia().use(testcaseEndpoints);
const customInputRouter = new Elysia().use(customSubmitEndpoint);


export { languagesRouter, submissionsRouter, userRouter, testcaseRouter, customInputRouter};
