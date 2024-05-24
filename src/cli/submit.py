#!/usr/bin/env python3

import requests
import argparse
import time
import os
import sys
from shared_cli import add_common_arguments


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