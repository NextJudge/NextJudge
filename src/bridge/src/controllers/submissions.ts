import { createClient } from 'redis';
import * as amqp from "amqplib/callback_api"

import { isValidToken } from "@util/main";
import { JudgeEvent, SubmissionRequest, SubmissionResult } from "@util/types";
import { randomUUID } from "node:crypto";
import { REDIS_HOST, REDIS_PORT, RABBITMQ_HOST, RABBITMQ_PORT, DATABASE_HOST, DATABASE_PORT } from '@util/constants';
import { SubmissionService } from '@classes/SubmissionService';
import { sleep, sleepSync } from 'bun';
import ApiService from '@classes/ApiService';

// TODO: Implement this in the data-layer so that we can append submissions.
const submissionService = new SubmissionService();

const SUBMISSION_QUEUE_NAME="submission_queue"
const BRIDGE_QUEUE_NAME="bridge_queue"

sleepSync(2000)
console.log(`Bridge connecting to amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`)
amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`, (e, connection) => {
  if(e){
    throw e
  }
  
  connection.createChannel((error, channel) => {
    if(error) { throw error }

    channel.assertQueue(BRIDGE_QUEUE_NAME, {
      durable: false
    })
    channel.prefetch(1)

    channel.consume(BRIDGE_QUEUE_NAME, (msg) => {
      const request = JSON.parse(msg.content.toString());

      console.log(request)


      let data: string;

      switch(request.type){
        case "submission_data": {

          try {
            // Query and return whatever the database returns
            // Send submission to the database
            console.log("querying database")
            submissionService.getSubmission(request.body).then(db_response =>
              {
                console.log("db_data")
                console.log(db_response)
                
                data = JSON.stringify(db_response)
                
                let i = channel.sendToQueue(msg?.properties.replyTo,
                  Buffer.from(data), {
                      correlationId: msg?.properties.correlationId
                  }
                );

                console.log("Acking!")
                channel.ack(msg)
              }

            );

          } catch (error) {
            console.log("Fatal error")
            throw { success: false, message: error };
          }
          break
        }
        case "test_data": {

          try {
            // Query and return whatever the database returns
            // Send submission to the database
            console.log("querying database")
            ApiService.get(
              `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/problems/${request.body}`
            ).then(response => response.json())
            .then(response => {

              console.log("testcases")
              // console.log(response)
              
              data = JSON.stringify(response)
              
              channel.sendToQueue(msg?.properties.replyTo,
                Buffer.from(data), {
                    correlationId: msg?.properties.correlationId
                }
              );

              console.log("Acking!")
              channel.ack(msg)
            })
            
             

          } catch (error) {
            console.log("Fatal error")
            throw { success: false, message: error };
          }
          break
        }

        case "get_languages": {

          try {
            // Query and return whatever the database returns
            // Send submission to the database
            console.log("querying database")
            ApiService.get(
              `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/languages`
            ).then(response => response.json())
            .then(response => {

              // console.log(response)
              
              data = JSON.stringify(response)
              
              channel.sendToQueue(msg?.properties.replyTo,
                Buffer.from(data), {
                    correlationId: msg?.properties.correlationId
                }
              );

              console.log("Acking!")
              channel.ack(msg)
            })
            
             

          } catch (error) {
            console.log("Fatal error")
            throw { success: false, message: error };
          }
          break
        }

        case "judgement": {

          try {
            // Query and return whatever the database returns
            // Send submission to the database
            console.log("querying database")
            ApiService.patch(
              `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/submissions/${request.body.submission_id}`,
              {
                status: request.body.success
              }
            ).then(response => response.json())
            .then(response => {
              // console.log(response)
              
              channel.sendToQueue(msg?.properties.replyTo,
                Buffer.from("Done!"), {
                    correlationId: msg?.properties.correlationId
                }
              );

              console.log("Acking!")
              channel.ack(msg)
            })

          } catch (error) {
            console.log("Fatal error")
            throw { success: false, message: error };
          }
          break
        }

        case "test": {
          data = request.body.toString()

          console.log("Sending back", data)
          channel.sendToQueue(msg?.properties.replyTo,
            Buffer.from(data), {
                correlationId: msg?.properties.correlationId
            }
          );
    
          channel.ack(msg)
          break;
      
        }
        
        default: {
          data = "Error"
          break;
        }
      }


    })

  })
})

export const createSubmission = async ({
  bearer,
  body,
}: {
  bearer: string;
  body: { user_id: number; source_code: string; language_id: number; problem_id: number };
}) => {
  try {
    // const [isValid, user] = await isValidToken(bearer, body.userId);

    // if (!isValid) {
    //   throw new Error("Unauthorized");
    // }

    // if (!user) {
    //   throw new Error("User not found");
    // }

    // Send submission to the database
    const submission_to_db_response = await submissionService.createSubmission(
      body as SubmissionRequest
    );

    const submission_id: number = submission_to_db_response.id;

    console.log("Sending submission to the queue", submission_id)
    await add_submission_to_queue(submission_id);
    
    return submission_id;
  } catch (error) {
    throw { success: false, message: error };
  }
};


async function add_submission_to_queue(submission_id: number){
  console.log(`Connecting to RabbitMQ ${RABBITMQ_HOST}:${RABBITMQ_PORT}`)

  amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`, (e, connection) => {
    if(e){
      throw e
    }
    
    connection.createChannel((error, channel) => {
      if(error) { throw error }

      channel.assertQueue(SUBMISSION_QUEUE_NAME)

      channel.sendToQueue(SUBMISSION_QUEUE_NAME, Buffer.from(submission_id.toString()), {
        persistent: true
      })

      console.log(`Sent ${submission_id}`);

      })
  })
}



// async function add_submission_to_queue(submission_id: number){
//   console.log(`Connecting to redis queue      redis://${REDIS_HOST}:${REDIS_PORT}`)
//   const client = createClient({
//     url:`redis://${REDIS_HOST}:${REDIS_PORT}`
//   });
//   client.on('error', err => console.log('Redis Client Error', err));
//   await client.connect();

//   console.log(`Connected to queue`)
//   await client.lPush('submissions', [submission_id.toString()]);
//   console.log(`Pushed submission ${submission_id} }to queue`)
// }




