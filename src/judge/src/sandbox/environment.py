import os
import shutil
import subprocess
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import config
from sandbox.languages import Language

RunResultReason = Literal["ACCEPTED"] | Literal["TIME_LIMIT_EXCEEDED"] | Literal["MEMORY_LIMIT_EXCEEDED"] | Literal["RUNTIME_ERROR"]
TestCaseResult = Literal["WRONG_ANSWER"] | RunResultReason
ResultReason = TestCaseResult | Literal["COMPILE_TIME_ERROR"]


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

    def __init__(self) -> None:
        self.id = f"{uuid.uuid4().hex}"
        self.top_level_dir = f"/{config.TARGET_TOP_LEVEL_DIRECTORY}/{self.id}"
        self.top_level_dir_build_dir = f"{self.top_level_dir}/{config.BUILD_DIRECTORY_NAME}"
        self.top_level_dir_executable_dir = f"{self.top_level_dir}/{config.RUN_DIRECTORY_NAME}"
        self.top_level_dir_build_script = f"{self.top_level_dir_build_dir}/{config.BUILD_SCRIPT_NAME}"
        self.top_level_dir_executable_script = f"{self.top_level_dir_executable_dir}/{config.RUN_SCRIPT_NAME}"

        self.inside_chroot_build_dir = f"/{config.BUILD_DIRECTORY_NAME}"
        self.inside_chroot_executable_dir = f"/{config.RUN_DIRECTORY_NAME}"
        self.inside_chroot_build_script = f"{self.inside_chroot_build_dir}/{config.BUILD_SCRIPT_NAME}"
        self.inside_chroot_executable_script = f"{self.inside_chroot_executable_dir}/{config.RUN_SCRIPT_NAME}"

    def create_directories(self) -> None:
        Path.mkdir(Path(self.top_level_dir))
        Path.mkdir(Path(self.top_level_dir_build_dir))
        Path.mkdir(Path(self.top_level_dir_executable_dir))

        Path.mkdir(Path(f"/chroot/{config.BUILD_DIRECTORY_NAME}"), exist_ok=True)
        Path.mkdir(Path(f"/chroot/{config.RUN_DIRECTORY_NAME}"), exist_ok=True)

        os.chown(f"/chroot/{config.BUILD_DIRECTORY_NAME}", config.NEXTJUDGE_USER_ID, config.NEXTJUDGE_USER_ID)
        os.chown(f"/chroot/{config.RUN_DIRECTORY_NAME}", config.NEXTJUDGE_USER_ID, config.NEXTJUDGE_USER_ID)

    def remove_files(self) -> None:
        shutil.rmtree(self.top_level_dir)

    def __repr__(self) -> str:
        return f"Environmnet: {self.id}"


def create_program_environment() -> ProgramEnvironment:
    return ProgramEnvironment()


def init_go_cache_directories() -> None:
    print("Initializing Go cache directories...")

    for cache_dir in [config.GO_CACHE_DIRECTORY, config.GO_MOD_CACHE_DIRECTORY]:
        os.makedirs(cache_dir, exist_ok=True)
        for root, dirs, files in os.walk(cache_dir):
            os.chown(root, config.NEXTJUDGE_USER_ID, config.NEXTJUDGE_USER_ID)
            for d in dirs:
                os.chown(os.path.join(root, d), config.NEXTJUDGE_USER_ID, config.NEXTJUDGE_USER_ID)
            for f in files:
                try:
                    os.chown(os.path.join(root, f), config.NEXTJUDGE_USER_ID, config.NEXTJUDGE_USER_ID)
                except OSError:
                    pass
        os.chmod(cache_dir, 0o755)

    print(f"Go cache initialized at {config.GO_CACHE_DIRECTORY} and {config.GO_MOD_CACHE_DIRECTORY}")


def compile_in_jail(
    source_code: str,
    language: Language | None,
    environment: ProgramEnvironment,
    verbose: bool = True,
) -> CompileResult:
    if language is None:
        return CompileResult(False, b"", b"")

    build_script = language.script
    extension = language.extension

    input_file_name = f"input.{extension}"

    with open(f"/{environment.top_level_dir_build_dir}/{input_file_name}", "w") as f:
        f.write(source_code)

    build_script = build_script.replace("{IN_FILE}", f"input.{extension}")

    with open(f"{environment.top_level_dir_build_script}", "w") as f:
        f.write(build_script)

    os.chmod(f"{environment.top_level_dir_build_script}", 0o755)
    os.chown(f"{environment.top_level_dir_build_script}", config.NEXTJUDGE_USER_ID, config.NEXTJUDGE_USER_ID)

    os.chown(f"{environment.top_level_dir_build_dir}", config.NEXTJUDGE_USER_ID, config.NEXTJUDGE_USER_ID)
    os.chown(f"{environment.top_level_dir_executable_dir}", config.NEXTJUDGE_USER_ID, config.NEXTJUDGE_USER_ID)

    nsjail_log_pipes = os.pipe()

    is_go = language and language.name.lower() == "go"
    max_cpus = "2" if is_go else "1"

    nsjail_args = [
        "nsjail",
        "--mode", "o",
        "--time_limit", f"{30}",
        "--max_cpus", max_cpus,
        "--rlimit_nofile", f"{512}",
        "--rlimit_as", f"{1024*16}",
        "--rlimit_cpu", f"{30}",
        "--rlimit_fsize", f"{512}",
        "--user", f"{config.NEXTJUDGE_USER_ID}:{config.NEXTJUDGE_USER_ID}",
        "--group", f"{config.NEXTJUDGE_USER_ID}:{config.NEXTJUDGE_USER_ID}",
        "--chroot", f"/chroot/",
        "--bindmount", f"{environment.top_level_dir_build_dir}:{environment.inside_chroot_build_dir}",
        "--bindmount", f"{environment.top_level_dir_executable_dir}:{environment.inside_chroot_executable_dir}",
        "--bindmount_ro", f"/dev/null",
        "--bindmount_ro", f"/dev/random",
        "--bindmount_ro", f"/dev/urandom",
        "--cwd", f"{environment.inside_chroot_build_dir}",
        "--mount", "none:/tmp:tmpfs:size=1073741824",
        "--env", "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "--env", "HOME=/home/NEXTJUDGE_USER",
    ]

    if is_go:
        init_go_cache_directories()
        nsjail_args.extend([
            "--bindmount", f"{config.GO_CACHE_DIRECTORY}:{config.GO_JAIL_CACHE_DIRECTORY}",
            "--bindmount", f"{config.GO_MOD_CACHE_DIRECTORY}:{config.GO_JAIL_MOD_CACHE_DIRECTORY}",
        ])
        if os.path.exists(config.GO_ROOT_DIRECTORY):
            nsjail_args.extend(["--bindmount_ro", f"{config.GO_ROOT_DIRECTORY}:{config.GO_ROOT_DIRECTORY}"])
        nsjail_args.extend([
            "--env", f"GOCACHE={config.GO_JAIL_CACHE_DIRECTORY}",
            "--env", f"GOMODCACHE={config.GO_JAIL_MOD_CACHE_DIRECTORY}",
            "--env", "GOROOT=/home/NEXTJUDGE_USER/go",
            "--env", "CGO_ENABLED=0",
            "--env", "GOTOOLCHAIN=local",
        ])

    nsjail_args.extend([
        "--exec_file", f"{environment.inside_chroot_build_script}",
        "--log_fd", f"{nsjail_log_pipes[1]}",
        "-v",
    ])

    if verbose and is_go:
        print(f"Go compile nsjail args: {' '.join(nsjail_args)}")

    compile_start = time.time()
    compile_result = subprocess.run(
        nsjail_args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        pass_fds=[nsjail_log_pipes[1]],
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
        return CompileResult(False, compile_result.stdout, compile_result.stderr)

    if verbose:
        print(f"stdout: {compile_result.stdout}")
        print(f"stderr: {compile_result.stderr}")
        print("Compiling succeeded!")

    return CompileResult(True, compile_result.stdout, compile_result.stderr)


def run_single(
    environment: ProgramEnvironment,
    input: bytes,
    verbose: bool = True,
    language: Language | None = None,
) -> RunResult:
    nsjail_log_pipes = os.pipe()

    nsjail_args = [
        "nsjail",
        "--mode", "o",
        "--time_limit", f"{10}",
        "--max_cpus", f"{1}",
        "--rlimit_as", f"{1024*6}",
        "--rlimit_cpu", f"{10}",
        "--nice_level", "-20",
        "--persona_addr_no_randomize",
        "--user", f"{config.NEXTJUDGE_USER_ID}:{config.NEXTJUDGE_USER_ID}",
        "--group", f"{config.NEXTJUDGE_USER_ID}:{config.NEXTJUDGE_USER_ID}",
        "--chroot", f"/chroot",
        "--bindmount_ro", f"{environment.top_level_dir_build_dir}:{environment.inside_chroot_build_dir}",
        "--bindmount_ro", f"{environment.top_level_dir_executable_dir}:{environment.inside_chroot_executable_dir}",
        "--cwd", f"{environment.inside_chroot_executable_dir}",
    ]

    if language and language.name.lower() == "go":
        nsjail_args.extend(["--mount", "none:/tmp:tmpfs:size=419430400"])

    nsjail_args.extend([
        "--env", f"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "--exec_file", f"{environment.inside_chroot_executable_script}",
        "--log_fd", f"{nsjail_log_pipes[1]}",
        "-v",
    ])

    t = time.time()
    run_result = subprocess.run(
        nsjail_args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        input=input,
        pass_fds=[nsjail_log_pipes[1]],
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
        has_timeout_keywords = (
            "time limit" in nsjail_errors_lower
            or "timeout" in nsjail_errors_lower
            or "wall time" in nsjail_errors_lower
            or "sigkill" in nsjail_errors_lower
        )
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


def split_and_trim(code: str) -> list[str]:
    return [x.rstrip() for x in code.split("\n")]


def compare_input_output(expected: str, real: str) -> bool:
    expected_lines = split_and_trim(expected.strip())
    real_lines = split_and_trim(real.strip())

    if len(expected_lines) != len(real_lines):
        return False

    for a, b in zip(expected_lines, real_lines):
        if a != b:
            return False

    return True


def run_single_test_case(
    testcase: Test,
    environment: ProgramEnvironment,
    verbose: bool = True,
    language: Language | None = None,
) -> TestResult:
    run_result = run_single(environment, testcase.input.encode("utf-8"), verbose, language=language)

    if run_result.result != "ACCEPTED":
        return TestResult(run_result.result, run_result.stdout, run_result.stderr)

    standard_out = run_result.stdout.decode("utf-8")
    expected_output = testcase.expected_output

    success = compare_input_output(expected_output, standard_out)

    if success:
        return TestResult("ACCEPTED", run_result.stdout, run_result.stderr)
    return TestResult("WRONG_ANSWER", run_result.stdout, run_result.stderr)


def simple_compile_and_run(source_code: str, language: Language, stdin_input: bytes = b"") -> FullResult:
    environment = create_program_environment()
    environment.create_directories()

    compile_result = compile_in_jail(source_code, language, environment)

    if not compile_result.success:
        environment.remove_files()
        return FullResult("COMPILE_TIME_ERROR", compile_result.stdout, compile_result.stderr)

    output = run_single(environment, stdin_input, language=language)

    environment.remove_files()

    return FullResult(output.result, output.stdout, output.stderr)


def simple_compile_and_run_tests(source_code: str, tests: list[Test], language: Language) -> FullResult | None:
    environment = create_program_environment()
    environment.create_directories()

    compile_result = compile_in_jail(source_code, language, environment, verbose=False)

    if not compile_result.success:
        print(compile_result.stdout)
        print(compile_result.stderr)
        environment.remove_files()
        return FullResult("COMPILE_TIME_ERROR", compile_result.stdout, compile_result.stderr)

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
