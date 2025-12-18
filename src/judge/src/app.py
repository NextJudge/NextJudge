#!/usr/bin/env python3

import argparse
import asyncio
import json
import os
import shutil
import subprocess
import sys
import time
import tomllib
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Literal

import aio_pika
import aio_pika.abc
import requests

RABBITMQ_HOST=os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT=os.getenv("RABBITMQ_PORT", 5672)

RABBITMQ_USER=os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASSWORD=os.getenv("RABBITMQ_PASSWORD", "guest")

NEXTJUDGE_HOST=os.getenv("NEXTJUDGE_HOST", "localhost")
NEXTJUDGE_PORT=os.getenv("NEXTJUDGE_PORT", 5000)

JUDGE_PASSWORD = os.getenv("JUDGE_PASSWORD")

NEXTJUDGE_ENDPOINT = f"http://{NEXTJUDGE_HOST}:{NEXTJUDGE_PORT}"

SUBMISSION_QUEUE_NAME="submission_queue"
BRIDGE_QUEUE_NAME="bridge_queue"

NEXTJUDGE_USER_ID = 99999

TARGET_TOP_LEVEL_DIRECTORY = "program_files"
GO_CACHE_DIRECTORY = "/go_cache"
GO_MOD_CACHE_DIRECTORY = "/go_mod_cache"

BUILD_DIRECTORY_NAME = "build"
RUN_DIRECTORY_NAME = "executable"

BUILD_SCRIPT_NAME = "build.sh"
RUN_SCRIPT_NAME = "main"


JUDGE_JWT_TOKEN=""

class RabbitMQClient(object):


    def __init__(self, p: aio_pika.abc.AbstractRobustConnection):
        self.connection = p

        # For receiving submissions
        # self.submission_channel = self.connection.channel()

        self.rpc_channel: aio_pika.abc.AbstractChannel = None
        self.callback_queue: aio_pika.abc.AbstractQueue = None
        self.futures = {}
        # dict[str, Callable] = dict()

    async def setup(self):

        # For getting information from the bridge
        self.rpc_channel = await self.connection.channel()

        # Ensure the bridge submission queue exists!
        await self.rpc_channel.declare_queue(BRIDGE_QUEUE_NAME)

        self.callback_queue = await self.rpc_channel.declare_queue('', exclusive=True)

        await self.callback_queue.consume(self.on_response)

    async def on_response(self, message: aio_pika.abc.AbstractIncomingMessage):
        async with message.process():
            future = self.futures.pop(message.correlation_id)
            future.set_result(message.body.decode("utf-8"))

    async def generic_call(self, body: object):
        corr_id = str(uuid.uuid4())

        self.response = None

        future = asyncio.Future()
        self.futures[corr_id] = future

        await self.rpc_channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(body).encode(),
                reply_to=self.callback_queue.name,
                correlation_id=corr_id
            ),
            routing_key=BRIDGE_QUEUE_NAME
        )

        return await future

    async def get_languages(self):
        return json.loads(await self.generic_call({"type":"get_languages"}))

    async def call_test(self, n):
        return await self.generic_call({"type":"test","body":n})

    async def get_submission_data(self, submission_id: str):
        return await self.generic_call({"type":"submission_data", "body":submission_id})

    async def get_test_data(self, testcase_id: str):
        return await self.generic_call({"type":"test_data", "body":testcase_id})

    async def send_judgement(self, body: dict):
        return await self.generic_call({"type":"judgement", "body":body})

    async def send_custom_input_result(self, body: dict):
        return await self.generic_call({"type":"custom_result", "body":body})


def get_languages():
    response = requests.get(f"{NEXTJUDGE_ENDPOINT}/v1/languages")
    data = response.json()
    # print(data)
    return data

def get_submission_data(submission_id: str):
    print(f"{NEXTJUDGE_ENDPOINT}/v1/submissions/{submission_id}")
    response = requests.get(
        f"{NEXTJUDGE_ENDPOINT}/v1/submissions/{submission_id}",
        headers={
            "Authorization":JUDGE_JWT_TOKEN
        }
    )
    data = response.json()
    print(data)
    return data

def get_test_data(problem_id: str):
    """
    Get all tests for a given problem_id
    """
    response = requests.get(
        f"{NEXTJUDGE_ENDPOINT}/v1/problem_description/{problem_id}/tests",
        headers={
            "Authorization":JUDGE_JWT_TOKEN
        }
    )
    print(response.content)
    data = response.json()
    print(data)
    return data

def post_judgement(submission_id: str, data):
    response = requests.patch(
        f"{NEXTJUDGE_ENDPOINT}/v1/submissions/{submission_id}",
        json=data,
        headers={
            "Authorization":JUDGE_JWT_TOKEN
        }
    )
    # print(data)
    return data

def post_custom_input_result(submission_id: str, body):
    response = requests.patch(
        f"{NEXTJUDGE_ENDPOINT}/v1/input_submissions/{submission_id}",
        json=body,
        headers={
            "Authorization":JUDGE_JWT_TOKEN
        }
    )
    print(response)

@dataclass
class Language:
    name: str
    script: str
    extension: str
    id: int

@dataclass
class Submission:
    source_code: str
    language_id: str
    problem_id: str
    id: int


@dataclass
class Test:
    input: str
    expected_output: str
    id: str

RunResultReason = Literal["ACCEPTED"] | Literal["TIME_LIMIT_EXCEEDED"] | Literal["MEMORY_LIMIT_EXCEEDED"] | Literal["RUNTIME_ERROR"]
TestCaseResult = Literal["WRONG_ANSWER"] | RunResultReason
ResultReason = TestCaseResult | Literal["COMPILE_TIME_ERROR"]

@dataclass
class CompileResult:
    success: bool
    stdout: bytes
    stderr: bytes

@dataclass
class RunResult:
    result: RunResultReason
    stdout: bytes
    stderr: bytes
    runtime: float = 0.0

@dataclass
class TestResult:
    result: TestCaseResult
    stdout: bytes
    stderr: bytes

@dataclass
class FullResult:
    result: ResultReason
    stdout: bytes
    stderr: bytes

LOCAL_LANGUAGES: list[Language] = []
LOCAL_LANGUAGES_MAP: dict[int, Language] = dict()
def parse_languages():
    path = Path(__file__).with_name("languages.toml")
    filename = path.absolute()
    language_data = tomllib.load(open(filename,"rb"))

    id = 0
    for supported_lang in language_data["language"]:
        LOCAL_LANGUAGES.append(Language(
            supported_lang["name"],
            supported_lang["script"],
            supported_lang["extension"],
            id
        ))
        id += 1

    for lang in LOCAL_LANGUAGES:
        LOCAL_LANGUAGES_MAP[lang.id] = lang



def get_language(local_language_id: int) -> Language | None:
    for lang in LOCAL_LANGUAGES:
        if lang.id == local_language_id:
            return lang
    return None

def get_language_by_extension(ext: str) -> Language | None:
    for lang in LOCAL_LANGUAGES:
        if lang.extension == ext:
            return lang
    return None

BRIDGE_LANG_ID_MAP: dict[str,int] = dict()

rabbitmq: RabbitMQClient = None


async def submit_judgement(submission, result: ResultReason, stdout: bytes, stderr: bytes, failed_test_case: str = "-1", test_case_results: list = None, time_elapsed: float = 0.0):

    body = {
        "submission_id": submission["id"],
        "status": result,
        "stdout": stdout.decode("utf-8"),
        "stderr": stderr.decode("utf-8"),
        "time_elapsed": time_elapsed
    }

    if result != "COMPILE_TIME_ERROR" and result != "ACCEPTED":
        body["failed_test_case_id"] = failed_test_case

    if test_case_results:
        body["test_case_results"] = test_case_results

    print("Submitting judgement to bridge")
    print(body)

    # r = await rabbitmq.send_judgement(body)
    r = post_judgement(submission["id"], body)
    # print(r)

async def submit_custom_input_judgement(id: str, result: ResultReason, stdout: bytes, stderr: bytes, runtime: float = 0.0):

    body = {
        "status": result,
        "stdout": stdout.decode("utf-8"),
        "stderr": stderr.decode("utf-8"),
        "runtime": runtime
    }

    # r = await rabbitmq.send_custom_input_result(body)
    # print(r)
    post_custom_input_result(id,body)

@dataclass
class ProgramEnvironment:
    id: str
    top_level_dir: str
    top_level_dir_build_dir: str
    top_level_dir_executable_dir: str
    top_level_dir_build_script: str
    top_level_dir_executable_script: str

    inside_chroot_build_dir: str
    inside_chroot_executable_dir: str
    inside_chroot_build_script: str
    inside_chroot_executable_script: str

    def __init__(self):
        self.id = f"{uuid.uuid4().hex}"
        self.top_level_dir = f"/{TARGET_TOP_LEVEL_DIRECTORY}/{self.id}"
        self.top_level_dir_build_dir = f"{self.top_level_dir}/{BUILD_DIRECTORY_NAME}"
        self.top_level_dir_executable_dir = f"{self.top_level_dir}/{RUN_DIRECTORY_NAME}"
        self.top_level_dir_build_script = f"{self.top_level_dir_build_dir}/{BUILD_SCRIPT_NAME}"
        self.top_level_dir_executable_script = f"{self.top_level_dir_executable_dir}/{RUN_SCRIPT_NAME}"

        self.inside_chroot_build_dir = f"/{BUILD_DIRECTORY_NAME}"
        self.inside_chroot_executable_dir = f"/{RUN_DIRECTORY_NAME}"
        self.inside_chroot_build_script = f"{self.inside_chroot_build_dir}/{BUILD_SCRIPT_NAME}"
        self.inside_chroot_executable_script = f"{self.inside_chroot_executable_dir}/{RUN_SCRIPT_NAME}"

    def create_directories(self):
        Path.mkdir(Path(self.top_level_dir))
        Path.mkdir(Path(self.top_level_dir_build_dir))
        Path.mkdir(Path(self.top_level_dir_executable_dir))

        # Set up permissions for the build and run folders
        Path.mkdir(Path(f"/chroot/{BUILD_DIRECTORY_NAME}"),exist_ok=True)
        Path.mkdir(Path(f"/chroot/{RUN_DIRECTORY_NAME}"),exist_ok=True)

        os.chown(f"/chroot/{BUILD_DIRECTORY_NAME}", NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)
        os.chown(f"/chroot/{RUN_DIRECTORY_NAME}", NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)


    def remove_files(self):
        shutil.rmtree(self.top_level_dir)

    def __repr__(self) -> str:
        return f"Environmnet: {self.id}"


def create_program_environment() -> ProgramEnvironment:
    return ProgramEnvironment()


# Used for testing. Compile and run code with optional stdin
def simple_compile_and_run(source_code: str, language: Language, stdin_input=b"") -> FullResult:
    environment = create_program_environment()
    environment.create_directories()

    compile_result = compile_in_jail(source_code, language, environment)

    if not compile_result.success:
        environment.remove_files()
        return FullResult("COMPILE_TIME_ERROR",compile_result.stdout, compile_result.stderr)

    output = run_single(environment, stdin_input, language=language)

    environment.remove_files()

    return FullResult(output.result, output.stdout, output.stderr)

def simple_compile_and_run_tests(source_code: str, tests:list[Test], language: Language) -> FullResult:
    environment = create_program_environment()
    environment.create_directories()

    compile_result = compile_in_jail(source_code, language, environment, verbose=False)

    if not compile_result.success:
        print(compile_result.stdout)
        print(compile_result.stderr)
        environment.remove_files()
        return FullResult("COMPILE_TIME_ERROR",compile_result.stdout, compile_result.stderr)

    for t in tests:
        run_result = run_single_test_case(t, environment, verbose=False)
        print(f"Test {t.id}: {run_result.result}")

        if run_result.result != "ACCEPTED":
            print("STDOUT")
            print(run_result.stdout)
            print("STDERR")
            print(run_result.stderr)

            print("EXPECTED")
            print(t.expected_output)


    environment.remove_files()

    return None


async def handle_test_submission(submission_id: str):
    # Get all the relevent information regarding this submission ID
    # raw_submission_data = await rabbitmq.get_submission_data(submission_id)
    # submission_data = json.loads(raw_submission_data)

    submission_data = get_submission_data(submission_id)

    # Get test data for this ID
    # raw_test_data = await rabbitmq.get_test_data(submission_data["problem_id"])
    # test_data = json.loads(raw_test_data)

    test_data = get_test_data(submission_data["problem"]["id"])

    tests: list[Test] = []

    for test in test_data["test_cases"]:
        tests.append(Test(test["input"], test["expected_output"], test["id"]))

    environment = create_program_environment()
    environment.create_directories()

    print(BRIDGE_LANG_ID_MAP)
    local_language_id = BRIDGE_LANG_ID_MAP.get(submission_data["language_id"])

    if local_language_id == None:
        print("No such language!")
        environment.remove_files()
        return

    compile_result = compile_in_jail(submission_data["source_code"], LOCAL_LANGUAGES_MAP[local_language_id], environment)

    if not compile_result.success:
        # Compile time error
        environment.remove_files()
        await submit_judgement(submission_data, "COMPILE_TIME_ERROR", compile_result.stdout, compile_result.stderr)
        return

    test_case_results = []
    last_stdout = b""
    last_stderr = b""
    total_time_elapsed = 0.0

    language = LOCAL_LANGUAGES_MAP[local_language_id]
    for test in tests:
        start_time = time.time()
        run_result = run_single_test_case(test, environment, language=language)
        elapsed = time.time() - start_time
        total_time_elapsed += elapsed

        test_case_results.append({
            "test_case_id": test.id,
            "stdout": run_result.stdout.decode("utf-8"),
            "stderr": run_result.stderr.decode("utf-8"),
            "passed": run_result.result == "ACCEPTED"
        })

        if run_result.result != "ACCEPTED":
            environment.remove_files()
            await submit_judgement(
                submission_data,
                run_result.result,
                run_result.stdout,
                run_result.stderr,
                test.id,
                test_case_results,
                total_time_elapsed
            )
            return

        last_stdout = run_result.stdout
        last_stderr = run_result.stderr

    environment.remove_files()

    await submit_judgement(submission_data, "ACCEPTED", last_stdout, last_stderr, "-1", test_case_results, total_time_elapsed)


async def handle_submission(message: aio_pika.abc.AbstractIncomingMessage):

    # Requeue the message if we fail, and reject attempts to redeliver it to us
    async with message.process(requeue=True,reject_on_redelivered=True):
        print(f"Judge received a submission")
        print(message.body)

        json_data = json.loads(message.body.decode("utf-8"))

        work_item_type = json_data["type"]
        if work_item_type == "submission":
            submission_id = json_data["id"]
            await handle_test_submission(submission_id)
        elif work_item_type == "input":
            source_code = json_data["code"]
            language_id = json_data["language_id"]
            stdin = json_data["stdin"]

            environment = create_program_environment()
            environment.create_directories()

            local_language_id = BRIDGE_LANG_ID_MAP.get(language_id)

            if local_language_id == None:
                print("No such language!")
                environment.remove_files()
                return

            if not compile_in_jail(source_code, LOCAL_LANGUAGES_MAP[local_language_id], environment).success:
                # Compile time error
                environment.remove_files()
                await submit_custom_input_judgement(json_data["id"], "COMPILE_TIME_ERROR", b"", b"")
                return

            language = LOCAL_LANGUAGES_MAP[local_language_id]
            run_result = run_single(environment, bytes(stdin,"utf-8"), language=language)
            environment.remove_files()

            await submit_custom_input_judgement(json_data["id"], run_result.result, run_result.stdout, run_result.stderr, run_result.runtime)




def compile_in_jail(source_code: str, language: Language | None, environment: ProgramEnvironment, verbose=True) -> CompileResult:

    if language is None:
        return CompileResult(False,b"",b"")

    build_script = language.script
    extension = language.extension

    INPUT_FILE_NAME = f"input.{extension}"

    with open(f"/{environment.top_level_dir_build_dir}/{INPUT_FILE_NAME}", "w") as f:
        f.write(source_code)

    build_script = build_script.replace("{IN_FILE}", f"input.{extension}")

    with open(f"{environment.top_level_dir_build_script}", "w") as f:
        f.write(build_script)

    os.chmod(f"{environment.top_level_dir_build_script}", 0o755)
    os.chown(f"{environment.top_level_dir_build_script}", NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)

    os.chown(f"{environment.top_level_dir_build_dir}", NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)
    os.chown(f"{environment.top_level_dir_executable_dir}", NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)

    nsjail_log_pipes = os.pipe()

    is_go = language and language.name.lower() == "go"
    max_cpus = "2" if is_go else "1"

    nsjail_args = [
        "nsjail",
        "--mode", "o",
        "--time_limit", f"{30}",
        "--max_cpus", max_cpus,
        "--rlimit_nofile", f"{128}",
        "--rlimit_as", f"{1024*16}",
        "--rlimit_cpu", f"{30}",
        "--rlimit_fsize", f"{512}",
        "--user", f"{NEXTJUDGE_USER_ID}:{NEXTJUDGE_USER_ID}",
        "--group", f"{NEXTJUDGE_USER_ID}:{NEXTJUDGE_USER_ID}",
        "--chroot", f"/chroot/",
        "--bindmount", f"{environment.top_level_dir_build_dir}:{environment.inside_chroot_build_dir}",
        "--bindmount", f"{environment.top_level_dir_executable_dir}:{environment.inside_chroot_executable_dir}",
        "--bindmount_ro", f"/dev/null",
        "--bindmount_ro", f"/dev/random",
        "--bindmount_ro", f"/dev/urandom",
        "--cwd", f"{environment.inside_chroot_build_dir}",
        '--mount', 'none:/tmp:tmpfs:size=1073741824',
        "--env", "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "--env", "HOME=/home/NEXTJUDGE_USER",
    ]

    if is_go:
        os.makedirs(GO_CACHE_DIRECTORY, exist_ok=True)
        os.chown(GO_CACHE_DIRECTORY, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)
        chroot_go_cache = "/chroot/go_cache"
        os.makedirs(chroot_go_cache, exist_ok=True)
        os.chown(chroot_go_cache, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)
        nsjail_args.extend(["--bindmount", f"{GO_CACHE_DIRECTORY}:/go_cache"])
        os.makedirs(GO_MOD_CACHE_DIRECTORY, exist_ok=True)
        os.chown(GO_MOD_CACHE_DIRECTORY, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)
        chroot_go_mod_cache = "/chroot/go_mod_cache"
        os.makedirs(chroot_go_mod_cache, exist_ok=True)
        os.chown(chroot_go_mod_cache, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)
        nsjail_args.extend(["--bindmount", f"{GO_MOD_CACHE_DIRECTORY}:/go_mod_cache"])

    nsjail_args.extend([
        "--exec_file", f"{environment.inside_chroot_build_script}",
        "--log_fd", f"{nsjail_log_pipes[1]}",
        "-v"
    ])

    if verbose and is_go:
        print(f"Go compile nsjail args: {' '.join(nsjail_args)}")

    compile_start = time.time()
    compile_result = subprocess.run(
        nsjail_args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        pass_fds=[nsjail_log_pipes[1]]
    )
    compile_elapsed = time.time() - compile_start

    os.close(nsjail_log_pipes[1])

    if verbose:
        print(f"Done compiling! elapsed={compile_elapsed:.3f}s")
    read_from = os.fdopen(nsjail_log_pipes[0])
    nsjail_errors = read_from.read()
    read_from.close()

    if compile_result.returncode:
        if verbose:
            print(f"Compile-time error - {compile_result.returncode}")
            print(f"stdout: {compile_result.stdout}")
            print(f"stderr: {compile_result.stderr}")
            print(f"nsjail log:\n{nsjail_errors}")
            print(f"nsjail args: {' '.join(nsjail_args)}")
        return CompileResult(False,compile_result.stdout,compile_result.stderr)

    if verbose:
        print(f"stdout: {compile_result.stdout}")
        print(f"stderr: {compile_result.stderr}")
        print("Compiling succeeded!")

    return CompileResult(True,compile_result.stdout,compile_result.stderr)




def run_single_test_case(testcase: Test, environment: ProgramEnvironment, verbose=True, language: Language | None = None) -> TestResult:

    # print(testcase.input.encode("utf-8"))

    run_result = run_single(environment, testcase.input.encode("utf-8"), verbose, language=language)

    # if verbose:
    #     print("OUTPUT:",run_result.stdout.decode("utf-8"))
    #     print("EXPECTED:",testcase.expected_output)

    if(run_result.result != "ACCEPTED"):
        return TestResult(run_result.result, run_result.stdout, run_result.stderr)
    else:
        standard_out = run_result.stdout.decode("utf-8")
        expected_output = testcase.expected_output

        success = compare_input_output(expected_output, standard_out)

        if success:
            return TestResult("ACCEPTED",run_result.stdout,run_result.stderr)
        else:
            return TestResult("WRONG_ANSWER",run_result.stdout,run_result.stderr)

def run_single(environment: ProgramEnvironment, input: bytes, verbose=True, language: Language | None = None) -> RunResult:

    # os.chmod(f"{environment.top_level_dir_executable_script}", 0o755)
    # os.chown(f"{environment.top_level_dir_executable_dir}", NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)
    # os.chown(f"{environment.top_level_dir_executable_script}", NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)

    nsjail_log_pipes = os.pipe()

    # if verbose:
    #     print(f"Input: {input}")
    #     print("Starting execution")

    nsjail_args = [
        "nsjail",
        "--mode", "o",
        "--time_limit", f"{10}",
        "--max_cpus", f"{1}",
        "--rlimit_as", f"{1024*6}", # // Max virtual memory space (increased for Java)
        "--rlimit_cpu", f"{10}", # Max CPU time
        # // "--rlimit_nofile", `${3}`, // Max file descriptor num+1 that can be opened
        "--nice_level", "-20", # High priority
        # // "--seccomp_policy", "Path to file containined seccomp-bpf policy. _string for string" // Allowed syscalls
        "--persona_addr_no_randomize", # // Disable ASLR
        "--user", f"{NEXTJUDGE_USER_ID}:{NEXTJUDGE_USER_ID}",
        "--group", f"{NEXTJUDGE_USER_ID}:{NEXTJUDGE_USER_ID}",

        "--chroot", f"/chroot", # // Chroot entire file system

        "--bindmount_ro", f"{environment.top_level_dir_build_dir}:{environment.inside_chroot_build_dir}", # Map build dir as read/write
        "--bindmount_ro", f"{environment.top_level_dir_executable_dir}:{environment.inside_chroot_executable_dir}", # Map executable dir as read/write

        # "--bindmount_ro", f"/chroot/{dir}:/{dir}", # // Map dir as readonly
        "--cwd", f"{environment.inside_chroot_executable_dir}",
    ]

    # For Go, mount /tmp as writable tmpfs
    if language and language.name.lower() == "go":
        nsjail_args.extend(['--mount', 'none:/tmp:tmpfs:size=419430400'])

    nsjail_args.extend([
        "--env", f"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",

        "--exec_file",f"{environment.inside_chroot_executable_script}",
        "--log_fd", f"{nsjail_log_pipes[1]}",
        # "--really_quiet"
        "-v"
    ])

    t = time.time()
    run_result = subprocess.run(
        nsjail_args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        input=input,
        pass_fds=[nsjail_log_pipes[1]]
    )
    os.close(nsjail_log_pipes[1])

    elapsed_time = time.time() - t
    if verbose:
        print("Program finished execution", elapsed_time)

    read_from = os.fdopen(nsjail_log_pipes[0])
    nsjail_errors = read_from.read()
    read_from.close()

    print("nsjail output")
    print(nsjail_errors)

    print(f"stdout: {run_result.stdout}")
    print(f"stderr: {run_result.stderr}")

    if run_result.returncode:
        nsjail_errors_lower = nsjail_errors.lower()
        has_timeout_keywords = "time limit" in nsjail_errors_lower or "timeout" in nsjail_errors_lower or "wall time" in nsjail_errors_lower or "sigkill" in nsjail_errors_lower
        is_likely_timeout = elapsed_time >= 9.5 and not run_result.stdout and not run_result.stderr

        if has_timeout_keywords or is_likely_timeout:
            if verbose:
                print(f"Time limit exceeded - {run_result.returncode}")
            return RunResult("TIME_LIMIT_EXCEEDED", run_result.stdout, run_result.stderr, elapsed_time)
        if verbose:
            print(f"Runtime error - {run_result.returncode}")
            print(f"stdout: {run_result.stdout}")
            print(f"stderr: {run_result.stderr}")
        return RunResult("RUNTIME_ERROR", run_result.stdout, run_result.stderr, elapsed_time)

    return RunResult("ACCEPTED", run_result.stdout, run_result.stderr, elapsed_time)




def split_and_trim(code: str):
    return [x.rstrip() for x in code.split("\n")]


def compare_input_output(expected: str, real: str):
    expected_lines = split_and_trim(expected.strip())
    real_lines = split_and_trim(real.strip())

    if len(expected_lines) != len(real_lines):
      return False

    # Compare the output line by line

    for a,b in zip(expected_lines, real_lines):
        if a != b:
            return False

    return True


async def connect_to_rabbitmq():
    connection_attempts = 0

    while(connection_attempts < 10):
        try:
            print(f"Connection attempt {connection_attempts} - {RABBITMQ_HOST}:{RABBITMQ_PORT}")

            connection = await aio_pika.connect_robust(
                f"amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:{RABBITMQ_PORT}",
            )

            return connection

        except aio_pika.AMQPException as e:
            print(str(e))
            connection_attempts += 1
            time.sleep(2)

def ensure_nextjudge_healthy_and_login(password: str):
    """
    The judge has to talk to the core service, so this checks that it's accessible before booting
    """
    connection_attempts = 0

    while(connection_attempts < 30):
        try:
            print(f"Connection attempt {connection_attempts} - {NEXTJUDGE_ENDPOINT}/healthy",flush=True)

            connection = requests.get(
                f"{NEXTJUDGE_ENDPOINT}/healthy",
            )

            if connection.status_code == 200:
                response = requests.post(
                    f"{NEXTJUDGE_ENDPOINT}/v1/login_judge",
                    headers={
                        "Authorization":password
                    }
                )

                global JUDGE_JWT_TOKEN
                JUDGE_JWT_TOKEN = response.json()["token"]

                return
        except requests.exceptions.ConnectionError as e:
            print(str(e))
            connection_attempts += 1
            time.sleep(3)

    raise Exception("Cannot connect to core server")


async def main():

    print("Reading languages.toml file")
    parse_languages()
    connection = await connect_to_rabbitmq()
    if not connection:
        return
    print("Successfully connected to RabbitMQ!")

    if not JUDGE_PASSWORD:
        print("Judge password is empty!")
        sys.exit(1)

    ensure_nextjudge_healthy_and_login(JUDGE_PASSWORD)
    print("Can contact the core service")
    # TODO:
    # This RPC breaks if the other side is not there to respond
    # Need another wait here to see that the rpc_queue is open
    # Setup RPC callbacks
    global rabbitmq
    rabbitmq = RabbitMQClient(connection)
    await rabbitmq.setup()

    languages = get_languages()
    # languages = await rabbitmq.get_languages()
    for bridge_lang in languages:
        for supported_lang in LOCAL_LANGUAGES:
            if supported_lang.name == bridge_lang["name"]:
                BRIDGE_LANG_ID_MAP[bridge_lang["id"]] = supported_lang.id

    # Setup submission queue
    submission_channel = await connection.channel()

    await submission_channel.set_qos(prefetch_count=1)
    queue = await submission_channel.declare_queue(SUBMISSION_QUEUE_NAME, durable=True)

    print("consuming")
    await queue.consume(handle_submission)

    # rabbitmq.call_test(14, lambda x: print(x))

    try:
        await asyncio.Future()
    except:
        await connection.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    parser.add_argument("--file", dest="file", required=False, default=None)
    parser.add_argument("--tests", dest="tests", required=False, default=None)
    parser.add_argument("--stdin", dest="stdin", required=False, default=None)


    args = parser.parse_args()

    if args.file is not None:

        parse_languages()

        try:
            source_code = open(args.file,"r",encoding="utf-8").read()
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

            # Get tests
            testcase_files = os.listdir(f"{args.tests}")

            if not testcase_files:
                print("No test cases found")
                sys.exit(1)

            testcase_names = [case[:-3] for case in testcase_files if case.endswith("in")]

            tests: list[Test] = []

            for name in testcase_names:
                test_input = open(f"{args.tests}/{name}.in", 'r').read()
                test_output = open(f"{args.tests}/{name}.ans", 'r').read()

                tests.append(Test(test_input,test_output,name))

            simple_compile_and_run_tests(source_code, tests, language)

    else:
        asyncio.run(main())
