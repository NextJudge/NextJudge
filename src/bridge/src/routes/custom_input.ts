import ApiService from "@classes/ApiService";
import { ProblemData } from "@util/types";
import { Elysia, t } from "elysia";
import { randomUUID } from "node:crypto";
import { rabbitmq } from "../rabbitmq/rabbitmq";


interface CustomRunResult {
    result: string;
    stdout: string;
    stderr: string;
}

const custom_submission_map = new Map<string, CustomRunResult>()


export function add_custom_run_result(key: string, res: CustomRunResult){
    custom_submission_map.set(key,res)
}

const createCustomSubmissionHook = {
    body: t.Object({
      user_id: t.String(),
      language_id: t.String(),
      source_code: t.String(),
      stdin: t.String(),
    }),
    // bearer: bearer,
  };

const customSubmitEndpoint = new Elysia()

    .post("/custom_input", async ({ bearer, body }: {
            bearer: string;
            body: { user_id: string; source_code: string; language_id: string; stdin: string};
        }) => {

            const id = randomUUID()

            // console.log("Sending submission to the queue", id)
            rabbitmq.addCustomInputSubmissionToQueue(id, body.stdin, body.source_code, body.language_id);
        
            return id;
        },
        createCustomSubmissionHook
    )

    .get("/custom_input/:id", async ({ bearer, params }: {
            bearer: string;
            params: { id: string };
        }) => {

            console.log("getting!")

            
            const val = custom_submission_map.get(params.id);
            if (val !== undefined) {
                
                custom_submission_map.delete(params.id)

                return {
                    status: val.result,
                    stdout: val.stdout,
                    stderr: val.stderr,
                };
            } else {
                return { 
                    status:"PENDING"
                }
            }
        }, 
        {
            params: t.Object({
                id:t.String()
            })
        }

);

export default customSubmitEndpoint;
