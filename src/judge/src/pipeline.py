import json
import time
from typing import TypedDict

import requests

import config
from sandbox.environment import (
    CompileResult,
    ProgramEnvironment,
    ResultReason,
    Test,
    compile_in_jail,
    create_program_environment,
    run_single,
    run_single_test_case,
)
from sandbox.languages import LOCAL_LANGUAGES_MAP, Language, BRIDGE_LANG_ID_MAP


class TestCaseResultPayload(TypedDict):
    test_case_id: str
    stdout: str
    stderr: str
    passed: bool


class SubmissionData(TypedDict, total=False):
    id: str
    status: str
    source_code: str
    language_id: str
    problem: dict[str, str]


def get_languages() -> list[dict[str, object]]:
    response = requests.get(f"{config.NEXTJUDGE_ENDPOINT}/v1/languages")
    data = response.json()
    return data


def get_submission_data(submission_id: str) -> SubmissionData:
    print(f"{config.NEXTJUDGE_ENDPOINT}/v1/submissions/{submission_id}")
    response = requests.get(
        f"{config.NEXTJUDGE_ENDPOINT}/v1/submissions/{submission_id}",
        headers={
            "Authorization": config.JUDGE_JWT_TOKEN,
        },
    )
    data = response.json()
    print(data)
    return data


def get_input_submission_data(submission_id: str) -> dict[str, object]:
    response = requests.get(
        f"{config.NEXTJUDGE_ENDPOINT}/v1/input_submissions/{submission_id}",
        headers={
            "Authorization": config.JUDGE_JWT_TOKEN,
        },
    )
    if not response.ok:
        raise RuntimeError(
            f"Failed to fetch input submission {submission_id}: "
            f"status_code={response.status_code}, response={response.text}"
        )
    data = response.json()
    print(data)
    return data


def get_test_data(problem_id: str) -> dict[str, object]:
    response = requests.get(
        f"{config.NEXTJUDGE_ENDPOINT}/v1/problem_description/{problem_id}/tests",
        headers={
            "Authorization": config.JUDGE_JWT_TOKEN,
        },
    )
    print(response.content)
    data = response.json()
    print(data)
    return data


def post_judgement(submission_id: str, data: dict[str, object]) -> requests.Response:
    response = requests.patch(
        f"{config.NEXTJUDGE_ENDPOINT}/v1/submissions/{submission_id}",
        json=data,
        headers={
            "Authorization": config.JUDGE_JWT_TOKEN,
        },
    )
    if not response.ok:
        raise RuntimeError(
            f"Failed to update submission {submission_id}: "
            f"status_code={response.status_code}, response={response.text}"
        )
    return response


def post_custom_input_result(submission_id: str, body: dict[str, object]) -> None:
    print(
        f"Sending custom input result for submission {submission_id}: "
        f"status={body.get('status')}, runtime={body.get('runtime')}",
        flush=True,
    )
    print(f"Full body: {json.dumps(body)}", flush=True)

    response = requests.patch(
        f"{config.NEXTJUDGE_ENDPOINT}/v1/input_submissions/{submission_id}",
        json=body,
        headers={
            "Authorization": config.JUDGE_JWT_TOKEN,
        },
    )

    if not response.ok:
        raise RuntimeError(
            f"Failed to update custom input submission {submission_id}: "
            f"status_code={response.status_code}, response={response.text}"
        )
    print(
        f"Successfully updated custom input submission {submission_id} "
        f"with runtime: {body.get('runtime', 0)}",
        flush=True,
    )


async def submit_judgement(
    submission: SubmissionData,
    result: ResultReason,
    stdout: bytes,
    stderr: bytes,
    failed_test_case: str = "-1",
    test_case_results: list[TestCaseResultPayload] | None = None,
    time_elapsed: float = 0.0,
) -> None:
    body: dict[str, object] = {
        "submission_id": submission["id"],
        "status": result,
        "stdout": stdout.decode("utf-8"),
        "stderr": stderr.decode("utf-8"),
        "time_elapsed": time_elapsed,
    }

    if result != "COMPILE_TIME_ERROR" and result != "ACCEPTED":
        body["failed_test_case_id"] = failed_test_case

    if test_case_results:
        body["test_case_results"] = test_case_results

    print("Submitting judgement to bridge")
    print(body)

    post_judgement(submission["id"], body)


async def submit_custom_input_judgement(
    submission_id: str,
    result: ResultReason,
    stdout: bytes,
    stderr: bytes,
    runtime: float = 0.0,
) -> None:
    body = {
        "status": result,
        "stdout": stdout.decode("utf-8"),
        "stderr": stderr.decode("utf-8"),
        "runtime": runtime,
    }

    post_custom_input_result(submission_id, body)


def resolve_local_language(language_id: str) -> Language | None:
    local_language_id = BRIDGE_LANG_ID_MAP.get(language_id)
    if local_language_id is None:
        return None
    return LOCAL_LANGUAGES_MAP.get(local_language_id)


def compile_submission(
    source_code: str,
    language_id: str,
    environment: ProgramEnvironment,
) -> tuple[Language | None, CompileResult | None]:
    language = resolve_local_language(language_id)
    if language is None:
        return None, None
    compile_result = compile_in_jail(source_code, language, environment)
    return language, compile_result


def build_tests_from_api(test_data: dict[str, object]) -> list[Test]:
    tests: list[Test] = []
    test_cases = test_data["test_cases"]
    if not isinstance(test_cases, list):
        return tests
    for test in test_cases:
        if not isinstance(test, dict):
            continue
        tests.append(Test(str(test["input"]), str(test["expected_output"]), str(test["id"])))
    return tests


def run_test_suite(
    tests: list[Test],
    environment: ProgramEnvironment,
    language: Language,
) -> tuple[ResultReason, bytes, bytes, str, list[TestCaseResultPayload], float]:
    test_case_results: list[TestCaseResultPayload] = []
    last_stdout = b""
    last_stderr = b""
    total_time_elapsed = 0.0

    for test in tests:
        start_time = time.time()
        run_result = run_single_test_case(test, environment, language=language)
        elapsed = time.time() - start_time
        total_time_elapsed += elapsed

        test_case_results.append({
            "test_case_id": test.id,
            "stdout": run_result.stdout.decode("utf-8"),
            "stderr": run_result.stderr.decode("utf-8"),
            "passed": run_result.result == "ACCEPTED",
        })

        if run_result.result != "ACCEPTED":
            return (
                run_result.result,
                run_result.stdout,
                run_result.stderr,
                test.id,
                test_case_results,
                total_time_elapsed,
            )

        last_stdout = run_result.stdout
        last_stderr = run_result.stderr

    return ("ACCEPTED", last_stdout, last_stderr, "-1", test_case_results, total_time_elapsed)


async def judge_test_submission(submission_data: SubmissionData) -> None:
    test_data = get_test_data(submission_data["problem"]["id"])
    tests = build_tests_from_api(test_data)

    environment = create_program_environment()
    environment.create_directories()

    print(BRIDGE_LANG_ID_MAP)
    language, compile_result = compile_submission(
        submission_data["source_code"],
        submission_data["language_id"],
        environment,
    )

    if language is None:
        print("No such language!")
        environment.remove_files()
        await submit_judgement(
            submission_data,
            "COMPILE_TIME_ERROR",
            b"",
            b"unsupported language",
        )
        return

    assert compile_result is not None

    if not compile_result.success:
        environment.remove_files()
        await submit_judgement(
            submission_data,
            "COMPILE_TIME_ERROR",
            compile_result.stdout,
            compile_result.stderr,
        )
        return

    result, stdout, stderr, failed_test_case, test_case_results, total_time = run_test_suite(
        tests,
        environment,
        language,
    )

    environment.remove_files()

    await submit_judgement(
        submission_data,
        result,
        stdout,
        stderr,
        failed_test_case,
        test_case_results,
        total_time,
    )


async def judge_custom_input_submission(
    submission_id: str,
    source_code: str,
    language_id: str,
    stdin: str,
) -> None:
    environment = create_program_environment()
    environment.create_directories()

    language, compile_result = compile_submission(source_code, language_id, environment)

    if language is None:
        print("No such language!")
        environment.remove_files()
        await submit_custom_input_judgement(submission_id, "RUNTIME_ERROR", b"", b"unsupported language")
        return

    assert compile_result is not None

    if not compile_result.success:
        environment.remove_files()
        await submit_custom_input_judgement(submission_id, "COMPILE_TIME_ERROR", b"", b"")
        return

    run_result = run_single(environment, bytes(stdin, "utf-8"), language=language)
    environment.remove_files()

    await submit_custom_input_judgement(
        submission_id,
        run_result.result,
        run_result.stdout,
        run_result.stderr,
        run_result.runtime,
    )
