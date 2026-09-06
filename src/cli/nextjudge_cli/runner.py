"""pipx entrypoint that delegates to the CLI script."""

from __future__ import annotations

import importlib.util
from pathlib import Path


def main() -> None:
    script_path = Path(__file__).resolve().parent.parent / "bin" / "nextjudge"
    spec = importlib.util.spec_from_file_location("nextjudge_bin", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load CLI script at {script_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.main()
