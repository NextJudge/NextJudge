#!/usr/bin/env python3

import argparse
import os

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

    # Parser for the 'b' command
    b_parser = toplevel_parser.add_parser("upload-challenge")
    b_parser.add_argument('--test',type=str)

    # Parser for the 'a' command
    a_parser = toplevel_parser.add_parser("submit")
    add_submit_script_args(a_parser)


    # Parse arguments
    args = parser.parse_args()

    # Handle sub-commands
    if args.command == 'a':
        print("asd")
    elif args.command == 'upload-challenge':
        print("dddd")
    # else:
    #     parser.print_help()


if __name__ == "__main__":
    main()
