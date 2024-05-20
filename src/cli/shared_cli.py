# common_args.py
import argparse
import os

def add_common_arguments(parser: argparse.ArgumentParser):
    host = os.getenv("HOST") or "localhost"
    port = os.getenv("PORT") or "3000"

    parser.add_argument("--host", type=str, dest="host", default=host, required=False, help="The host to connect to")
    parser.add_argument("--port", type=int, dest="port", default=port, required=False, help="The port to connect to")



def parse_args(description):
    parser = argparse.ArgumentParser(description=description)
    add_common_arguments(parser)
    return parser.parse_args()
