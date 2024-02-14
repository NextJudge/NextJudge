import { createSubmission, getSubmission } from "@controllers/submissions";
import { createSubmissionHook, getSubmissionHook } from "@hooks/users";
import { Elysia } from "elysia";

const submissionEndpoints = new Elysia()
  // .derive(({ headers }) => {
  //   const auth = headers["authorization"];

  //   if (!auth) {
  //     throw { success: false, message: "Unauthorized" };
  //   }

  //   const token = auth.split(" ")[1];

  //   if (!token) {
  //     throw { success: false, message: "Unauthorized" };
  //   }

  //   return {
  //     bearer: token,
  //   };
  // })
  .post("/submission", createSubmission, createSubmissionHook)
  .get("/submission", getSubmission, getSubmissionHook);

export default submissionEndpoints;
