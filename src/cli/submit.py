#!/usr/bin/env python3

import requests
import argparse
import time
import os
import sys
from shared_cli import add_common_arguments



def send_solution(sol_path, problem_id, host, port) -> dict:
    BRIDGE_ENDPOINT = f"http://{host}:{port}"

    try:
        source_code = open(sol_path,"r", encoding="utf-8").read()
    except FileNotFoundError:
        print(f"Could not find file {sol_path}")
        return None
    except OSError as e:
        print(f"Could not open file {sol_path} - {e}")
        return None


    try:
        bridge_languages = requests.get(f"{BRIDGE_ENDPOINT}/languages")
    except:
        print(f"Failed to connect to {BRIDGE_ENDPOINT}")
        return None

    real_langs = bridge_languages.json()

    language_id = None

    for lang in real_langs:
        if sol_path.endswith(lang["extension"]):
            language_id = lang["id"]

    if language_id is None:
        print("Could not map the file to a language (based on extension)")
        print(real_langs)
        return None


    submit = requests.post(
        f"{BRIDGE_ENDPOINT}/submission",
        json = {
            "user_id": 1,
            "source_code": source_code,
            "language_id": language_id,
            "problem_id": problem_id
        }
    )

    if(submit.status_code != 200):
        print(f"Failed to send submission: {submit.text}")
        return None

    print(f"Submission ID: {submit.text}")


    max_polls = 12
    initial_delay = 0.3
    max_delay = 2.4
    increment = (max_delay - initial_delay) / (max_polls - 1)

    delay = initial_delay

    for i in range(28):
        time.sleep(delay)

        verdict = requests.get(
            f"{BRIDGE_ENDPOINT}/submission/{submit.text}",
        )

        result = verdict.json()
        status = result["status"]

        if status != "PENDING" and status != "":
            print(f"Verdict: {status}")
            return result

        delay = min(delay+increment,max_delay)

    return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog='Upload submission',
        description='Upload a submission to the NextJudge system',
    )

    add_common_arguments(parser)

    parser.add_argument("solution_file_path")
    parser.add_argument("problem_id", type=int)

    args = parser.parse_args()

    BRIDGE_HOST=args.host
    BRIDGE_PORT=args.port

    sol_path: str = args.solution_file_path
    problem_id: int = args.problem_id

    send_solution(sol_path, problem_id, BRIDGE_HOST, BRIDGE_PORT)