#!/usr/bin/env python3
import argparse
import os
import sys

import tempfile

from pathlib import Path
from shared_cli import add_common_arguments 
from upload_challenge import parse_and_send_folder
from submit import send_solution

parser = argparse.ArgumentParser(
    prog='Upload challenge',
    description='Upload a challenge to the NextJudge system',
)

add_common_arguments(parser,"5000")

parser.add_argument("directory")
parser.add_argument("--skip", dest="skip", default="")
args = parser.parse_args()

DATABASE_HOST=args.host
DATABASE_PORT=args.port

directories = [d.name for d in Path(args.directory).iterdir() if d.is_dir()]
# print(directories)

tmp_file_name = tempfile.NamedTemporaryFile(delete=False)
log_file = open(tmp_file_name.name,'wb')

print("Name:", log_file.name)

skipping = args.skip.split(" ") if args.skip else []

for directory in directories:
    print(directory)

    b = False
    for s in skipping:
        if s in directory:
            print(f"Skipping {directory}")
            b = True
            break
    if b:
        continue

    s = parse_and_send_folder(f"{args.directory}/{directory}",DATABASE_HOST,DATABASE_PORT)
    
    # if s.success:

    files = [f for f in Path(f"{args.directory}/{directory}/submissions/accepted").iterdir() if f.is_file()]

    for f in files:
        if not str(f).endswith("java"):
            print("Skipping java submission")
            continue

        print(f"File extension: {f.suffix}")

        r = send_solution(str(f),s.id,"localhost","3000")
        if r is not None:
            if r["status"] != "ACCEPTED":
                print("Failed:", (str(f)))
                log_file.write(f"{str(f)}:{r['status']}\n".encode())
                log_file.flush()

print(log_file.name)
