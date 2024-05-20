#!/usr/bin/env python3

import requests
import argparse
import time
import os
import sys
from shared_cli import add_common_arguments

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
BRIDGE_ENDPOINT = f"http://{BRIDGE_HOST}:{BRIDGE_PORT}"

sol_path: str = args.solution_file_path
problem_id: int = args.problem_id

try:
    source_code = open(sol_path,"r", encoding="utf-8").read()
except FileNotFoundError:
    print(f"Could not find file {sol_path}")
    sys.exit(1)
except OSError as e:
    print(f"Could not open file {sol_path} - {e}")
    sys.exit(1)

try:
    bridge_languages = requests.get(f"{BRIDGE_ENDPOINT}/languages")
except:
    print(f"Failed to connect to {BRIDGE_ENDPOINT}")
    sys.exit(1)

real_langs = bridge_languages.json()

language_id = None

for lang in real_langs:
    if sol_path.endswith(lang["extension"]):
        language_id = lang["id"]

if language_id is None:
    print("Could not map the file to a language (based on extension)")
    print(real_langs)
    sys.exit(1)

submit = requests.post(
    f"http://{BRIDGE_HOST}:{BRIDGE_PORT}/submission",
    json = {
        "user_id": 1,
        "source_code": source_code,
        "language_id": language_id,
        "problem_id": problem_id
    }
)

if(submit.status_code != 200):
    sys.exit(1)

print(f"Submission ID: {submit.text}")


max_polls = 12
initial_delay = 0.3
max_delay = 1.5
increment = (max_delay - initial_delay) / (max_polls - 1)

delay = initial_delay

for i in range(25):
    time.sleep(delay)

    verdict = requests.get(
        f"{BRIDGE_ENDPOINT}/submission/{submit.text}",
    )

    result = verdict.json()
    status = result["status"]

    if status != "PENDING" and status != "":
        print(f"Verdict: {status}")
        break

    delay = min(delay+increment,max_delay)

