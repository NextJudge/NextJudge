import asyncio
import json
import uuid

import aio_pika
import aio_pika.abc

from config import BRIDGE_QUEUE_NAME


class RabbitMQClient:
    def __init__(self, p: aio_pika.abc.AbstractRobustConnection):
        self.connection = p
        self.rpc_channel: aio_pika.abc.AbstractChannel | None = None
        self.callback_queue: aio_pika.abc.AbstractQueue | None = None
        self.futures: dict[str, asyncio.Future[str]] = {}

    async def setup(self) -> None:
        self.rpc_channel = await self.connection.channel()
        await self.rpc_channel.declare_queue(BRIDGE_QUEUE_NAME)
        self.callback_queue = await self.rpc_channel.declare_queue("", exclusive=True)
        await self.callback_queue.consume(self.on_response)

    async def on_response(self, message: aio_pika.abc.AbstractIncomingMessage) -> None:
        async with message.process():
            future = self.futures.pop(message.correlation_id)
            future.set_result(message.body.decode("utf-8"))

    async def generic_call(self, body: object) -> str:
        corr_id = str(uuid.uuid4())
        future: asyncio.Future[str] = asyncio.Future()
        self.futures[corr_id] = future

        await self.rpc_channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(body).encode(),
                reply_to=self.callback_queue.name,
                correlation_id=corr_id,
            ),
            routing_key=BRIDGE_QUEUE_NAME,
        )

        return await future

    async def get_languages(self) -> object:
        return json.loads(await self.generic_call({"type": "get_languages"}))

    async def call_test(self, n: object) -> str:
        return await self.generic_call({"type": "test", "body": n})

    async def get_submission_data(self, submission_id: str) -> str:
        return await self.generic_call({"type": "submission_data", "body": submission_id})

    async def get_test_data(self, testcase_id: str) -> str:
        return await self.generic_call({"type": "test_data", "body": testcase_id})

    async def send_judgement(self, body: dict[str, object]) -> str:
        return await self.generic_call({"type": "judgement", "body": body})

    async def send_custom_input_result(self, body: dict[str, object]) -> str:
        return await self.generic_call({"type": "custom_result", "body": body})
