import * as amqp from "amqplib"

import ApiService from "@classes/ApiService";
import { SubmissionService } from "@classes/SubmissionService";
import { RABBITMQ_HOST, RABBITMQ_PORT, DATABASE_HOST, DATABASE_PORT } from "@util/constants";

const submissionService = new SubmissionService();

const SUBMISSION_QUEUE_NAME="submission_queue"
const BRIDGE_QUEUE_NAME="bridge_queue"

export class RabbitMQConnection {

    connection: amqp.Connection
    submission_channel: amqp.Channel

    async setup(){
        console.log(`Bridge connecting to amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`)
        
        this.connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`)
        
        this.submission_channel = await this.connection.createChannel();
        this.submission_channel.assertQueue(SUBMISSION_QUEUE_NAME)


        const rpc_channel = await this.connection.createChannel();

        rpc_channel.assertQueue(BRIDGE_QUEUE_NAME, {
            durable: false
        })

        rpc_channel.prefetch(1)

        rpc_channel.consume(BRIDGE_QUEUE_NAME, (msg) => {
            if(!msg){
                throw "msg is null!"
            }

            const request = JSON.parse(msg.content.toString());

            switch(request.type){
                case "submission_data": {
                    this.handle_submission_data_request(msg, rpc_channel, request.body)
                    break;
                }
                case "test_data": {
                    this.handle_test_data_request(msg, rpc_channel, request.body)
                    break;
                }
                case "get_languages": {
                    this.handle_get_languages_request(msg, rpc_channel)
                    break;
                }
                case "judgement": {
                    this.handle_judgement_request(msg, rpc_channel, request.body)
                    break
                }
                case "test": {
                    this.handle_test_request(msg, rpc_channel, request.body)
                }
                default: {
                    console.log("UNKNOWN REQUEST")
                    throw new Error()
                }
            }
        })
                
    }

    addSubmissionToQueue(submission_id: number){

        console.log("Sending!", submission_id)

        try {
            this.submission_channel.sendToQueue(SUBMISSION_QUEUE_NAME, 
            Buffer.from(submission_id.toString()), {
                persistent: true
            })
        } catch (e) {
            console.log(e)
        }

        console.log(`Sent ${submission_id}`);
    }

    handle_submission_data_request(msg: amqp.ConsumeMessage, channel: amqp.Channel, id: number){
        console.log("getting submission stuff")
        try {
            // Query and return whatever the database returns
            // Send submission to the database
            submissionService.getSubmission(id).then(db_response =>
                {
                    console.log("db_data")
                    console.log(db_response)
                    
                    const data = JSON.stringify(db_response)
                    
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
    }

    handle_test_data_request(msg: amqp.ConsumeMessage, channel: amqp.Channel, id: number){
        try {
            // Query and return whatever the database returns
            // Send submission to the database
            console.log("querying database")
            ApiService.get(
                `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/problems/${id}`
            ).then(response => response.json())
                .then(response => {

                console.log("testcases")
                // console.log(response)
                
                const data = JSON.stringify(response)
                
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
    }

    handle_get_languages_request(msg: amqp.ConsumeMessage, channel: amqp.Channel){
        try {
            // Query and return whatever the database returns
            // Send submission to the database
            ApiService.get(
            `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/languages`
            ).then(response => response.json())
                .then(response => {

                // console.log(response)
                
                const data = JSON.stringify(response)
                
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

    }
    
    handle_judgement_request(msg: amqp.ConsumeMessage, channel: amqp.Channel, body: object){
        try {
            // Query and return whatever the database returns
            // Send submission to the database'

            console.log(body, typeof(body))

            const data = body.success == "ACCEPTED" ? {
                status:body.success,
              } : {
                status:body.success,
                failed_test_case_id:body.failed_test_case_id
              }


            console.log(`http://${DATABASE_HOST}:${DATABASE_PORT}/v1/submissions/${body.submission_id}`)
            ApiService.patch(
            `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/submissions/${body.submission_id}`,
            data
            ).then(response => response.json())
                .then(response => {
                
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
    }

    handle_test_request(msg: amqp.ConsumeMessage, channel: amqp.Channel, body: object){
        const data = body.toString()

        channel.sendToQueue(msg?.properties.replyTo,
            Buffer.from(data), {
                correlationId: msg?.properties.correlationId
            }
        );
    
        console.log("ACK")
        channel.ack(msg)
    }
}

let rabbitmq_instance: RabbitMQConnection | null = null

export function createRabbitMQConnection(){
    if (!rabbitmq_instance) {
        rabbitmq_instance = new RabbitMQConnection();
    }
    return rabbitmq_instance;
}

const rabbitmq = createRabbitMQConnection()
export { rabbitmq }


