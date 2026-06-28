#!/usr/bin/env python3

import argparse
import asyncio
import os
import sys
import time
from pathlib import Path

import requests

import config
import handlers
from handlers import connect_to_rabbitmq, handle_submission
from mq.client import RabbitMQClient
from pipeline import get_languages
from sandbox.environment import (
    FullResult,
    Test,
    create_program_environment,
    init_go_cache_directories,
    simple_compile_and_run,
    simple_compile_and_run_tests,
)
from sandbox.languages import (
    LOCAL_LANGUAGES,
    BRIDGE_LANG_ID_MAP,
    get_language_by_extension,
    parse_languages,
)

__all__ = [
    "BRIDGE_LANG_ID_MAP",
    "FullResult",
    "Test",
    "create_program_environment",
    "get_language_by_extension",
    "init_go_cache_directories",
    "os",
    "parse_languages",
    "simple_compile_and_run",
    "simple_compile_and_run_tests",
]


def ensure_nextjudge_healthy_and_login(password: str) -> None:
    connection_attempts = 0

    while connection_attempts < 30:
        try:
            print(f"Connection attempt {connection_attempts} - {config.NEXTJUDGE_ENDPOINT}/healthy", flush=True)

            connection = requests.get(
                f"{config.NEXTJUDGE_ENDPOINT}/healthy",
            )

            if connection.status_code == 200:
                response = requests.post(
                    f"{config.NEXTJUDGE_ENDPOINT}/v1/login_judge",
                    headers={
                        "Authorization": password,
                    },
                )

                config.JUDGE_JWT_TOKEN = response.json()["token"]

                return
        except requests.exceptions.ConnectionError as e:
            print(str(e))
            connection_attempts += 1
            time.sleep(3)

    raise Exception("Cannot connect to core server")


async def main() -> None:
    print("Reading languages.toml file")
    parse_languages()

    init_go_cache_directories()
    connection = await connect_to_rabbitmq()
    if not connection:
        return
    print("Successfully connected to RabbitMQ!")

    if not config.JUDGE_PASSWORD:
        print("Judge password is empty!")
        sys.exit(1)

    ensure_nextjudge_healthy_and_login(config.JUDGE_PASSWORD)
    print("Can contact the core service")

    handlers.rabbitmq = RabbitMQClient(connection)
    await handlers.rabbitmq.setup()

    languages = get_languages()
    for bridge_lang in languages:
        for supported_lang in LOCAL_LANGUAGES:
            if supported_lang.name == bridge_lang["name"]:
                BRIDGE_LANG_ID_MAP[bridge_lang["id"]] = supported_lang.id

    submission_channel = await connection.channel()

    await submission_channel.set_qos(prefetch_count=1)
    queue = await submission_channel.declare_queue(config.SUBMISSION_QUEUE_NAME, durable=True)

    print("consuming")
    await queue.consume(handle_submission)

    try:
        await asyncio.Future()
    except:
        await connection.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument("--file", dest="file", required=False, default=None)
    parser.add_argument("--tests", dest="tests", required=False, default=None)
    parser.add_argument("--stdin", dest="stdin", required=False, default=None)

    args = parser.parse_args()

    if args.file is not None:
        parse_languages()
        init_go_cache_directories()

        try:
            source_code = open(args.file, "r", encoding="utf-8").read()
        except OSError as e:
            print(f"Could not open file {args.file} - {e}")
            sys.exit(1)

        extension = Path(args.file).suffix[1:]
        language = get_language_by_extension(extension)

        if language is None:
            print(f"Cannot resolve language from filename: {args.file}")
            sys.exit(1)

        if args.stdin is not None:
            result = simple_compile_and_run(source_code, language, args.stdin.encode("utf-8"))

            print(result.result)
            print(result.stdout.decode("utf-8"))
            print(result.stderr.decode("utf-8"))

        elif args.tests is not None:
            testcase_files = os.listdir(f"{args.tests}")

            if not testcase_files:
                print("No test cases found")
                sys.exit(1)

            testcase_names = [case[:-3] for case in testcase_files if case.endswith("in")]

            tests: list[Test] = []

            for name in testcase_names:
                test_input = open(f"{args.tests}/{name}.in", "r").read()
                test_output = open(f"{args.tests}/{name}.ans", "r").read()

                tests.append(Test(test_input, test_output, name))

            simple_compile_and_run_tests(source_code, tests, language)

    else:
        asyncio.run(main())
