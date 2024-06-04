import { SubmissionService } from "@classes/SubmissionService";
import { createSubmission } from "@controllers/submissions";
import { createSubmissionHook } from "@hooks/users";
import { Elysia, t } from "elysia";

const submissionService = new SubmissionService();

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
  .get("/submission/:submission_id", async ({ bearer, params }: {
          bearer: string;
          params: { submission_id: string };
        }) => {
          try {
            // Query and return whatever the database returns
            // Send submission to the database
            const db_response = await submissionService.getSubmission(params.submission_id);
        
            return db_response;
        
          } catch (error) {
            throw { success: false, message: error };
          }
        }, 
    {
    params: t.Object({
      submission_id:t.String()
    })
  });




export default submissionEndpoints;
