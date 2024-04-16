#!/usr/bin/env python3

from dataclasses import dataclass
from typing import Callable
import asyncio
import os
import uuid
import time
import json
import subprocess
import tomllib
import aio_pika
import aio_pika.abc
import shutil
import time

RABBITMQ_HOST=os.getenv("RABBITMQ_HOST", "localhost") 
RABBITMQ_PORT=os.getenv("RABBITMQ_PORT", 5672) 

SUBMISSION_QUEUE_NAME="submission_queue"
BRIDGE_QUEUE_NAME="bridge_queue"

NEXTJUDGE_USER_ID = 99999
BUILD_DIRECTORY = "/chroot/build_dir"
RUN_DIRECTORY = "/chroot/run_dir"

BUILD_SCRIPT_PATH = f"{BUILD_DIRECTORY}/build.sh"
RUN_SCRIPT_PATH = f"{RUN_DIRECTORY}/main"



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


@dataclass
class Language:
    name: str
    script: str
    extension: str
    id: int

LANGUAGES: list[Language] = []


def get_build_script(language_id: int):
    
    for lang in LANGUAGES:
        if(lang.id == language_id):
            return lang.script

    return None

# Temp
def get_extension(language_id: int):
    for lang in LANGUAGES:
        if lang.id == language_id:
            return lang.extension
    return None


rabbitmq: RabbitMQClient = None


async def submit_judgement(submission, success):

    # TODO: make the non-accepted case more specific
    body = {
        "submission_id": submission["id"],
        "success": "ACCEPTED" if success else "WRONG_ANSWER"
    }

    print("Submitting judgement to bridge")
    print(body)

    r = await rabbitmq.send_judgement(body)
    print(r)


async def handle_submission(message: aio_pika.abc.AbstractIncomingMessage):

    async with message.process():
        print(f"Judge received a submission")
        print(message.body)
        submission_id = message.body.decode("utf-8")

        # Get all the relevent information regarding this submission ID
        raw_submission_data = await rabbitmq.get_submission_data(submission_id)
        submission_data = json.loads(raw_submission_data)

        # Get test data for this ID
        raw_test_data = await rabbitmq.get_test_data(submission_data["problem_id"])
        test_data = json.loads(raw_test_data)

        # Can swap this with pathlib mkdir parents=true exist ok = true
        subprocess.run(
            ["mkdir","-p", BUILD_DIRECTORY]
        )

        subprocess.run(
            ["mkdir","-p", RUN_DIRECTORY]
        )

        if not compile_in_jail(submission_data):
            # Compile time error

            # TODO: make this a seperate "cleanup" function

            shutil.rmtree(BUILD_DIRECTORY)
            await submit_judgement(submission_data, False)
            return
        
        success = True
        for test in test_data["test_cases"]:
            if not run_single_test_case(test):
                success = False
                break

        shutil.rmtree(RUN_DIRECTORY)
        shutil.rmtree(BUILD_DIRECTORY)

        await submit_judgement(submission_data, success)

def compile_in_jail(submission):
    
    source_code = submission["source_code"]

    print("Source code")
    print(source_code)
    build_script = get_build_script(submission["language_id"])

    if not build_script:
        print(f"No build script for language {submission['language_id']}")
        return False

    extension = get_extension(submission["language_id"])
    if not extension:
        print(f"No extension for language {submission['language_id']}")
        return False


    INPUT_FILE_PATH = f"{BUILD_DIRECTORY}/input.{extension}"

    print("Writing code to {INPUT_FILE_PATH}")

    with open(INPUT_FILE_PATH, "w") as f:
        f.write(source_code)

    LOCAL_BUILD_DIR = "/build_dir"
    LOCAL_BUILD_SCRIPT_PATH = F"{LOCAL_BUILD_DIR}/build.sh"

    build_script = build_script.replace("{IN_FILE}", f"{LOCAL_BUILD_DIR}/input.{extension}")

    print("Build script")
    print(build_script)

    with open(BUILD_SCRIPT_PATH, "w") as f:
        f.write(build_script)

    os.chmod(BUILD_SCRIPT_PATH, 0o755)
    os.chown(BUILD_DIRECTORY, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)
    os.chown(BUILD_SCRIPT_PATH, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)


    print("Compiling")

    # subprocess.run(["ls","-pla", "/chroot/"])
    # subprocess.run(["ls","-pla", "/chroot/build_dir/"])

    # print(LOCAL_BUILD_DIR)
    # print(LOCAL_BUILD_SCRIPT_PATH)
    

    nsjail_log_pipes = os.pipe()

    compile_result = subprocess.run(
        [
            "nsjail",
            "--mode", "o",

            "--time_limit", f"{10}", # Max wall time
            "--max_cpus", f"{1}", 

            "--rlimit_nofile", f"{128}", # Max file descriptor number (32)
            "--rlimit_as", f"{1024}", # Max virtual memory space
            "--rlimit_cpu", f"{10}", # Max CPU time
            "--rlimit_fsize", f"{512}", # Max file size in MB (1)
            
            "--user", f"{NEXTJUDGE_USER_ID}:{NEXTJUDGE_USER_ID}",
            "--group", f"{NEXTJUDGE_USER_ID}:{NEXTJUDGE_USER_ID}",

            # "--bindmount_ro", "/chroot:/", // Map root file system readonly
            "--chroot", f"/chroot/", # Chroot entire file system

            # // Read/write mounts
            "--bindmount", f"{BUILD_DIRECTORY}:{LOCAL_BUILD_DIR}", # Map build dir as read/write
            "--bindmount", f"/chroot/root/.cache:/root/.cache", # Map build dir as read/write

            # // Readonly mounts
            # // "--bindmount_ro", `/dev/urandom:/dev/urandom`,
            # // "--bindmount_ro", `/dev/zero:/dev/zero`,
            "--bindmount_ro", f"/dev/null",

            "--cwd", f"{LOCAL_BUILD_DIR}",

            # // "--tmpfsmount", "/tmp",
            '--mount', 'none:/tmp:tmpfs:size=419430400', # // Mount /tmp as tmpfs, make it larger than default (4194304)

            "--env", "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "--env", "HOME=/root", # User is not really root, but some Dockerfile commands for compilers/runtimes add application files to root home
            
            "--exec_file",f"{LOCAL_BUILD_SCRIPT_PATH}",
            
            "--log_fd", f"{nsjail_log_pipes[1]}",
            # "--really_quiet"
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        pass_fds=[nsjail_log_pipes[1]]
    )

    os.close(nsjail_log_pipes[1])

    print("Done!")
    read_from = os.fdopen(nsjail_log_pipes[0])
    nsjail_errors = read_from.read()
    read_from.close()
    print("nsjail output")
    print(nsjail_errors)

    stderr = compile_result.stderr
    if stderr or compile_result.returncode:
        print("stderr")
        print(stderr,compile_result.returncode)
        return False
    
    shutil.copyfile(f"{BUILD_DIRECTORY}/main", f"{RUN_SCRIPT_PATH}")
    print("Compiling succeeded!")
    return True




def run_single_test_case(testcase):

    os.chmod(RUN_SCRIPT_PATH, 0o755)
    os.chown(RUN_DIRECTORY, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)
    os.chown(RUN_SCRIPT_PATH, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID)

    nsjail_log_pipes = os.pipe()

    # print(testcase["input"].encode("utf-8"))
    print("Starting execution")
    t = time.time()
    run_result = subprocess.run(
        [
            "nsjail",
            "--mode", "o",
            "--time_limit", f"{10}",
            "--max_cpus", f"{1}", 
            "--rlimit_as", f"{1024}", # // Max virtual memory space
            "--rlimit_cpu", f"{10}", # Max CPU time
            # // "--rlimit_nofile", `${3}`, // Max file descriptor num+1 that can be opened
            "--nice_level", "-20", # High priority
            # // "--seccomp_policy", "Path to file containined seccomp-bpf policy. _string for string" // Allowed syscalls 
            "--persona_addr_no_randomize", # // Disable ASLR
            "--user", f"{NEXTJUDGE_USER_ID}:{NEXTJUDGE_USER_ID}",
            "--group", f"{NEXTJUDGE_USER_ID}:{NEXTJUDGE_USER_ID}",

            # // "--bindmount_ro", "/:/chroot", // Map root file system readonly
            "--chroot", f"/chroot", # // Chroot entire file system
            
            "--bindmount", f"{RUN_DIRECTORY}:/run_dir", # // Map build dir as read/write
            "--cwd", f"/run_dir",

            "--env", f"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",

            "--exec_file",f"/run_dir/main",
            "--log_fd", f"{nsjail_log_pipes[1]}",
            # "--really_quiet"
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        input=testcase["input"].encode("utf-8"),
        pass_fds=[nsjail_log_pipes[1]]
    )
    os.close(nsjail_log_pipes[1])

    print("Program finished execution", time.time() - t)

    read_from = os.fdopen(nsjail_log_pipes[0])
    nsjail_errors = read_from.read()
    read_from.close()

    print("nsjail output")
    # print(nsjail_errors)

    stderr = run_result.stderr
    if stderr or run_result.returncode:
        print("Error in runtime!")
        print(stderr,run_result.returncode)
        return False

    process_stdout = run_result.stdout.decode("utf-8")
    # print(process_stdout)

    print("Starting to compare results")
    success = compare_input_output(testcase["expected_output"], process_stdout)
    print("Done comparing results")

    if success:
        print("Program is correct!")
    else:
        print("Program is incorrect!!")

    return success

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
                f"amqp://{RABBITMQ_HOST}:{RABBITMQ_PORT}",
            )

            return connection

        except aio_pika.AMQPException as e:
            print(str(e))
            connection_attempts += 1
            time.sleep(2)

async def main():
    print("Reading languages.toml file")
    language_data = tomllib.load(open("languages.toml","rb"))
    print(language_data)

    connection = await connect_to_rabbitmq()
    if not connection:
        return
    
    print("Successfully connected!")

    # TODO:
    # This RPC breaks if the other side is not there to respond
    # Need another wait here to see that the rpc_queue is open
    # Setup RPC callbacks
    global rabbitmq
    rabbitmq = RabbitMQClient(connection)
    await rabbitmq.setup()
    
    languages = await rabbitmq.get_languages()
    for lang in languages:
        for supported_lang in language_data["language"]:
            if supported_lang["name"] == lang["name"]:
                LANGUAGES.append(Language(
                    supported_lang["name"],
                    supported_lang["script"],
                    supported_lang["extension"],
                    lang["id"]
                ))
                print(supported_lang["script"])

    # rpc_channel = await connection.channel()
    # result_queue = await rpc_channel.declare_queue('', exclusive=True)


    # Setup submission queue
    submission_channel = await connection.channel()

    await submission_channel.set_qos(prefetch_count=1)
    queue = await submission_channel.declare_queue(SUBMISSION_QUEUE_NAME, durable=True)
    
    await queue.consume(handle_submission)

    # rabbitmq.call_test(14, lambda x: print(x))

    try:
        await asyncio.Future()
    except:
        await connection.close()





if __name__ == '__main__':
    asyncio.run(main())

# Give the judge a random ID so the server can identify it when communicating through RabbitMQ
# CLIENT_ID = str(uuid.uuid4())
# QUEUE_NAME = f"judge_queue_{CLIENT_ID}"
# channel.queue_declare(queue=QUEUE_NAME, exclusive=True)

# def callback(ch, method, properties, body):
#     print(f"Got a message: {body.decode()}")

# channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback, auto_ack=True)

# channel.start_consuming()
