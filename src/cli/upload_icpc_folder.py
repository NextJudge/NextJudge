#!/usr/bin/env python3
import argparse
import os
import sys

from pathlib import Path
from shared_cli import add_common_arguments 
from upload_challenge import parse_and_send_folder


parser = argparse.ArgumentParser(
    prog='Upload challenge',
    description='Upload a challenge to the NextJudge system',
)

add_common_arguments(parser,"5000")

parser.add_argument("directory")
args = parser.parse_args()

DATABASE_HOST=args.host
DATABASE_PORT=args.port


directories = [d.name for d in Path(args.directory).iterdir() if d.is_dir()]

print(directories)

success = 0
for directory in directories:
    s = parse_and_send_folder(f"{args.directory}/{directory}",DATABASE_HOST,DATABASE_PORT)
    if s:
        success += 1

print(f"Successfully Uploaded {success} out of {len(directories)} problems ")
