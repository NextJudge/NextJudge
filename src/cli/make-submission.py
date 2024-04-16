#!/usr/bin/env python3
# Parse and upload an challenge according to the ICPC problem package specification

import requests
import argparse
import time
import os
import sys

parser = argparse.ArgumentParser(
    prog='Upload submission',
    description='Upload a submission to the NextJudge system',
)

parser.add_argument("solution_file_path")
parser.add_argument("problem_id", type=int)
args = parser.parse_args()


BRIDGE_HOST=os.getenv("HOST") or "localhost"
BRIDGE_PORT=os.getenv("PORT") or "3000"

sol_path: str = args.solution_file_path
problem_id: int = args.problem_id

source_code = open(f"{sol_path}", 'r').read()

bridge_languages = requests.get(f"http://{BRIDGE_HOST}:{BRIDGE_PORT}/languages")

real_langs = bridge_languages.json()

# extension to id
lang_mapping: dict[str,int] = {}

language_id = None

for lang in real_langs:
    if sol_path.endswith(lang["extension"]):
        language_id = lang["id"]

if language_id is None:
    print("Could not map the file to a language (based on extension)")
    print(real_langs)
    sys.exit(1)


# Load all testcases now
# print(test_cases)



submit = requests.post(
    f"http://{BRIDGE_HOST}:{BRIDGE_PORT}/submission",
    json = {
        "user_id": 1,
        "source_code": source_code,
        "language_id": language_id,
        "problem_id": problem_id
    }
)

print(submit.status_code, submit.text)

if(submit.status_code != 200):
    sys.exit(1)

start_time = time.time()
# Poll
for i in range(20):
    time.sleep(.2)

# for i in range(1):
    # time.sleep(2)
    verdict = requests.get(
        f"http://{BRIDGE_HOST}:{BRIDGE_PORT}/submission/{submit.text}",
    )

    result = verdict.json()
    status = result["status"]

    if status != "PENDING" and status != "":
        print(f"Verdict: {status}")
        print(time.time() - start_time)
        break

