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

# def get_b_parser():
#     parser = argparse.ArgumentParser(description="Command B", parents=[get_common_parser()])
#     parser.add_argument('--option2', type=str, help='Option 2 for command B')
#     return parser


def main():
    parser = argparse.ArgumentParser(
        description="Command line interface for NextJudge"
    )
    
    add_common_arguments(parser, 3000)

    toplevel_parser = parser.add_subparsers(dest="command", help="Sub-commands")

    # Parser for the 'a' command
    a_parser = toplevel_parser.add_parser('a', help='Command A')
    add_submit_script_args(a_parser)

    # Parser for the 'b' command
    b_parser = toplevel_parser.add_parser('b', help='Command B')
    b_parser.add_argument('--option2', type=str, help='Option 2 for command B')

    # Parse arguments
    args = parser.parse_args()

    # Handle sub-commands
    if args.command == 'a':
        print("asd")
        print(args.port)
    elif args.command == 'b':
        print("dddd")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
