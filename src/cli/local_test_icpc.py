#!/usr/bin/env python3
import argparse
import os
import sys
import subprocess

import tempfile

from pathlib import Path
from shared_cli import add_common_arguments 
from upload_challenge import parse_and_send_folder
from submit import send_solution


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


def run_test(directory: str, choose=None, test_choose=None):

    # if s.success:
    testcase_files = os.listdir(f"{directory}/data/secret")
    testcase_names = [case[:-3] for case in testcase_files if case.endswith("in")]

    test_cases = []
    for name in testcase_names:
        test_input = open(f"{directory}/data/secret/{name}.in", 'r').read()
        test_output = open(f"{directory}/data/secret/{name}.ans", 'r').read()

        test_cases.append({
            "name": f"{name}.in",
            "input": test_input,
            "expected_output": test_output
        })


    files = [f for f in Path(f"{directory}/submissions/accepted").iterdir() if f.is_file()]

    for f in files:
        if choose is not None and choose not in str(f):
            print(f"Skipping {str(f)}")
            continue

        if str(f).endswith("java"):
            print("Skipping java submission")
            continue

        print(f"File extension: {f.suffix}")

        
        for test in test_cases:
            if test_choose is not None and test_choose not in str(test["name"]):
                continue

            run = subprocess.run(
                [
                    "python3",
                    f
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                input=test["input"].encode("utf-8"),
            )


            # print(run.stdout)
            if not compare_input_output(run.stdout.decode("utf-8"),test["expected_output"]):
                print("WRONG")
                print("stderr:", run.stderr)

                print(run.stdout.decode("utf-8"))
                print(test["expected_output"])
                print(test["name"])
            else:
                print("CORRECT")


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        prog='Upload challenge',
        description='Upload a challenge to the NextJudge system',
    )

    parser.add_argument("directory")
    parser.add_argument("--choose", dest="choose", default=None, required=False)
    parser.add_argument("--test", dest="test", default=None, required=False)
    args = parser.parse_args()


    run_test(args.directory,args.choose,args.test)

