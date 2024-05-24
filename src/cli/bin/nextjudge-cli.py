#!/usr/bin/env python3

import argparse
import os
import requests
import os
import sys
import time
from dataclasses import dataclass
import yaml
from pathlib import Path


def add_common_arguments(parser: argparse.ArgumentParser,default_port):
    host = os.getenv("HOST") or "localhost"
    port = os.getenv("PORT") or default_port

    parser.add_argument("--host", type=str, dest="host", default=host, required=False, help="The host to connect to")
    parser.add_argument("--port", type=int, dest="port", default=port, required=False, help="The port to connect to")


def add_submit_script_args(parser: argparse.ArgumentParser):
    parser.add_argument("solution_file_path")
    parser.add_argument("problem_id", type=int)
    return parser


def main():
    parser = argparse.ArgumentParser(
        description="Command line interface for NextJudge"
    )
    
    add_common_arguments(parser, 3000)

    toplevel_parser = parser.add_subparsers(dest="command", help="Sub-commands")

    upload_challenge_parser = toplevel_parser.add_parser("upload-challenge")
    upload_challenge_parser.add_argument('directory_to_problem')


    suite_parser = toplevel_parser.add_parser("upload-challenge-suite")
    suite_parser.add_argument("directory")


    submit_parser = toplevel_parser.add_parser("submit")
    add_submit_script_args(submit_parser)


    custom_parser = toplevel_parser.add_parser("custom-run")
    custom_parser.add_argument("solution_file_path")
    custom_parser.add_argument("stdin")


    # Parse arguments
    args = parser.parse_args()

    # Handle sub-commands
    if args.command == "submit":
        send_solution(args.solution_file_path, args.problem_id, args.host, args.port)
    elif args.command == "upload-challenge":
        args.port = "5000"
        parse_and_send_folder(args.directory_to_problem, args.host, args.port)
    elif args.command == "upload-challenge-suite":
        args.port = "5000"

        directories = [d.name for d in Path(args.directory).iterdir() if d.is_dir()]

        success = 0
        for directory in directories:
            s = parse_and_send_folder(f"{args.directory}/{directory}",args.host,args.port)
            if s:
                success += 1
        
        print(f"Successfully Uploaded {success} out of {len(directories)} problems ")

    elif args.command == "custom-run":
        BRIDGE_HOST=args.host
        BRIDGE_PORT=args.port
        BRIDGE_ENDPOINT = f"http://{BRIDGE_HOST}:{BRIDGE_PORT}"

        sol_path: str = args.solution_file_path

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
            f"http://{BRIDGE_HOST}:{BRIDGE_PORT}/custom_input",
            json = {
                "user_id": 1,
                "source_code": source_code,
                "language_id": language_id,
                "stdin": args.stdin
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
                f"http://{BRIDGE_HOST}:{BRIDGE_PORT}/custom_input/{submit.text}",
            )

            result = verdict.json()
            print(result)

            status = result["status"]
            if status != "PENDING" and status != "":
                print(f"Result: {result['status']}")
                print(f"stdout: {result['stdout']}")
                print(f"stderr: {result['stderr']}")
                break

            delay = min(delay+increment,max_delay)



    else:
        print("Unknown command")
        parser.print_help()


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
            break

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
    max_delay = 3.5
    increment = (max_delay - initial_delay) / (max_polls - 1)

    delay = initial_delay

    for i in range(32):
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



@dataclass
class SendResult:
    success: bool
    id: int

def parse_and_send_folder(dir: str, host: str, port: str) -> SendResult:
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
    testcase_names = [case[:-3] for case in testcase_files if case.endswith("in")]

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
            f"http://{host}:{port}/v1/problems",
            json = {
            "title": title,
            "prompt": statement,
            "timeout": 1,
            "difficulty": "MEDIUM",
            "user_id": 1,
            "test_cases": test_cases
            }
        )
    except:
        print(f"Failed to connect to database")
        sys.exit(1)

    print(submit_problem.status_code)

    if 200 <= submit_problem.status_code < 300 :
        response_json = submit_problem.json()
        id = response_json['id']
        print("Successfully upload problem")
        print(f"Problem ID: {id}")
        return SendResult(True, id)

    return SendResult(False, -1)












if __name__ == "__main__":
    main()
