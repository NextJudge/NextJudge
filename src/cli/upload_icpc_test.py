#!/usr/bin/env python3
import argparse
import os
import sys

import tempfile

from pathlib import Path
from shared_cli import add_common_arguments 
from upload_challenge import parse_and_send_folder
from submit import send_solution


def upload_and_run(directory: str, host, port,choose=None):

    s = parse_and_send_folder(f"{directory}",host,port)
    
    # if s.success:

    files = [f for f in Path(f"{directory}/submissions/accepted").iterdir() if f.is_file()]

    for f in files:
        if choose is not None and choose not in str(f):
            print(f"Skipping {str(f)}")
            continue

        if not str(f).endswith("java"):
            print("Skipping java submission")
            continue

        print(f"File extension: {f.suffix}")

        r = send_solution(str(f),s.id,"localhost","3000")
        if r is not None:
            if r["status"] != "ACCEPTED":
                print("Failed:", (str(f)))

if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        prog='Upload challenge',
        description='Upload a challenge to the NextJudge system',
    )

    add_common_arguments(parser,"5000")

    parser.add_argument("directory")
    parser.add_argument("--choose", dest="choose", default=None, required=False)

    args = parser.parse_args()

    DATABASE_HOST=args.host
    DATABASE_PORT=args.port

    upload_and_run(args.directory, DATABASE_HOST, DATABASE_PORT,args.choose)

