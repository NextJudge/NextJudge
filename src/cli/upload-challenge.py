#!/usr/bin/env python3
# Parse and upload an challenge according to the ICPC problem package specification

import requests
import argparse
import os
import sys
import yaml

from shared_cli import add_common_arguments

parser = argparse.ArgumentParser(
    prog='Upload challenge',
    description='Upload a challenge to the NextJudge system',
)

add_common_arguments(parser)

parser.add_argument("directory_to_problem")
args = parser.parse_args()

DATABASE_HOST=args.host
DATABASE_PORT=args.port

dir = args.directory_to_problem

with open(f"{dir}/problem.yaml", 'r') as file:
    problem_description = yaml.safe_load(file)

title = problem_description["name"]

try:
    statement = open(f"{dir}/problem_statement/problem.en.tex","r").read()
except:
    print("Cannot find a problem.en.tex")
    sys.exit(1)

# Load all testcases now

testcase_files = os.listdir(f"{dir}/data/secret")
testcase_names = [case[:-3] for case in testcase_files if not case.endswith("ans")]

test_cases = []
for name in testcase_names:
    test_input = open(f"{dir}/data/secret/{name}.in", 'r').read()
    test_output = open(f"{dir}/data/secret/{name}.ans", 'r').read()

    test_cases.append({
        "input": test_input,
        "expected_output": test_output
    })

print(f"Title: {title}")
print(f"Number of testcases: {len(test_cases)}")

try:
    submit_problem = requests.post(
        f"http://{DATABASE_HOST}:{DATABASE_PORT}/v1/problems",
        json = {
        "title": title,
        "prompt": statement,
        "timeout": 1,
        "user_id": 1,
        "test_cases": test_cases
        }
    )
except:
    print(f"Failed to connect to database")
    sys.exit(1)

response_json = submit_problem.json()

print(submit_problem.status_code)
if submit_problem.status_code == 200:
    print("Successfully upload problem")
    print(f"Problem ID: {response_json['id']}")
