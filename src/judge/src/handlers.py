import asyncio
import json
import time

import aio_pika
import aio_pika.abc

import config
from pipeline import (
    get_input_submission_data,
    get_submission_data,
    judge_custom_input_submission,
    judge_test_submission,
)


async def handle_test_submission(submission_id: str) -> None:
    submission_data = await asyncio.to_thread(get_submission_data, submission_id)

    if submission_data.get("status") != "PENDING":
        print(f"Submission {submission_id} already judged ({submission_data.get('status')}), skipping")
        return

    await judge_test_submission(submission_data)


async def handle_custom_input_submission(json_data: dict[str, object]) -> None:
    submission_id = str(json_data["id"])

    input_data = await asyncio.to_thread(get_input_submission_data, submission_id)
    if input_data.get("finished"):
        print(f"Input submission {submission_id} already finished, skipping")
        return

    source_code = str(input_data["source_code"])
    language_id = str(input_data["language_id"])
    stdin = str(input_data["stdin"])

    await judge_custom_input_submission(submission_id, source_code, language_id, stdin)


async def handle_submission(message: aio_pika.abc.AbstractIncomingMessage) -> None:
    async with message.process(requeue=True):
        print("Judge received a submission")
        print(message.body)

        json_data = json.loads(message.body.decode("utf-8"))

        work_item_type = json_data["type"]
        if work_item_type == "submission":
            submission_id = json_data["id"]
            await handle_test_submission(submission_id)
        elif work_item_type == "input":
            await handle_custom_input_submission(json_data)


async def connect_to_rabbitmq() -> aio_pika.abc.AbstractRobustConnection | None:
    connection_attempts = 0

    while connection_attempts < 10:
        try:
            print(f"Connection attempt {connection_attempts} - {config.RABBITMQ_HOST}:{config.RABBITMQ_PORT}")

            connection = await aio_pika.connect_robust(
                f"amqp://{config.RABBITMQ_USER}:{config.RABBITMQ_PASSWORD}@"
                f"{config.RABBITMQ_HOST}:{config.RABBITMQ_PORT}",
            )

            return connection

        except aio_pika.AMQPException as e:
            print(str(e))
            connection_attempts += 1
            time.sleep(2)

    return None
