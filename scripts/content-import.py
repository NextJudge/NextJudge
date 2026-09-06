#!/usr/bin/env python3
"""Dry-run importer for content/catalog problem packages."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

REQUIRED_SOLUTIONS = ("cpp17.cpp", "python3.py", "typescript.ts")
REQUIRED_FIELDS = ("slug", "name", "identifier", "difficulty", "prompt")


@dataclass
class TestCaseSpec:
    name: str
    input: str
    expected_output: str
    hidden: bool


@dataclass
class ProblemPackage:
    directory: Path
    manifest: dict[str, Any]
    test_cases: list[TestCaseSpec] = field(default_factory=list)
    editorial_path: Path | None = None
    solution_paths: dict[str, Path] = field(default_factory=dict)
    checksum: str = ""


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def default_catalog_dir() -> Path:
    return repo_root() / "content" / "catalog"


def is_hidden_testcase(stem: str) -> bool:
    return "-secret" in stem or stem.startswith("secret-")


def load_testcases(testcases_dir: Path) -> list[TestCaseSpec]:
    if not testcases_dir.is_dir():
        raise ValueError(f"missing testcases directory: {testcases_dir}")

    stems = sorted({path.stem for path in testcases_dir.glob("*.in")})
    if not stems:
        raise ValueError(f"no .in files found in {testcases_dir}")

    cases: list[TestCaseSpec] = []
    for stem in stems:
        input_path = testcases_dir / f"{stem}.in"
        output_path = testcases_dir / f"{stem}.out"
        if not output_path.is_file():
            raise ValueError(f"missing output file for testcase {stem}: {output_path}")

        cases.append(
            TestCaseSpec(
                name=stem,
                input=input_path.read_text(encoding="utf-8"),
                expected_output=output_path.read_text(encoding="utf-8"),
                hidden=is_hidden_testcase(stem),
            )
        )

    return cases


def package_checksum(package: ProblemPackage) -> str:
    digest = hashlib.sha256()
    digest.update(json.dumps(package.manifest, sort_keys=True).encode("utf-8"))

    for case in package.test_cases:
        digest.update(case.name.encode("utf-8"))
        digest.update(case.input.encode("utf-8"))
        digest.update(case.expected_output.encode("utf-8"))
        digest.update(str(case.hidden).encode("utf-8"))

    if package.editorial_path is not None:
        digest.update(package.editorial_path.read_bytes())

    for name in sorted(package.solution_paths):
        digest.update(name.encode("utf-8"))
        digest.update(package.solution_paths[name].read_bytes())

    return digest.hexdigest()


def load_problem_package(problem_dir: Path) -> ProblemPackage:
    manifest_path = problem_dir / "problem.yaml"
    if not manifest_path.is_file():
        raise ValueError(f"missing problem.yaml in {problem_dir}")

    manifest = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
    if not isinstance(manifest, dict):
        raise ValueError(f"problem.yaml must be a mapping: {manifest_path}")

    for field_name in REQUIRED_FIELDS:
        if field_name not in manifest or manifest[field_name] in (None, ""):
            raise ValueError(f"{manifest_path}: missing required field '{field_name}'")

    solutions_dir = problem_dir / "solutions"
    solution_paths: dict[str, Path] = {}
    for filename in REQUIRED_SOLUTIONS:
        solution_path = solutions_dir / filename
        if not solution_path.is_file():
            raise ValueError(f"missing solution file: {solution_path}")
        solution_paths[filename] = solution_path

    editorial_path = problem_dir / "editorial.md"
    if not editorial_path.is_file():
        raise ValueError(f"missing editorial.md in {problem_dir}")

    package = ProblemPackage(
        directory=problem_dir,
        manifest=manifest,
        test_cases=load_testcases(problem_dir / "testcases"),
        editorial_path=editorial_path,
        solution_paths=solution_paths,
    )
    package.checksum = package_checksum(package)
    return package


def discover_packages(catalog_dir: Path) -> list[Path]:
    if not catalog_dir.is_dir():
        raise ValueError(f"catalog directory not found: {catalog_dir}")

    return sorted(
        path
        for path in catalog_dir.iterdir()
        if path.is_dir() and not path.name.startswith(".")
    )


def build_import_plan(package: ProblemPackage) -> dict[str, Any]:
    limits = package.manifest.get("limits", {})
    editorial = package.manifest.get("editorial", {})

    return {
        "slug": package.manifest["slug"],
        "identifier": package.manifest["identifier"],
        "title": package.manifest["name"],
        "difficulty": package.manifest["difficulty"],
        "source": package.manifest.get("source", ""),
        "state": package.manifest.get("state", "draft"),
        "public": package.manifest.get("public", False),
        "prompt_chars": len(str(package.manifest["prompt"])),
        "editorial_chars": package.editorial_path.read_text(encoding="utf-8").__len__() if package.editorial_path else 0,
        "editorial_visibility": editorial.get("visibility", "after_solve"),
        "test_case_count": len(package.test_cases),
        "public_test_cases": sum(1 for case in package.test_cases if not case.hidden),
        "hidden_test_cases": sum(1 for case in package.test_cases if case.hidden),
        "solutions": sorted(package.solution_paths.keys()),
        "limits": {
            "accept_timeout": limits.get("accept_timeout", 2.0),
            "execution_timeout": limits.get("execution_timeout", 2.0),
            "memory_limit": limits.get("memory_limit", 256),
        },
        "checksum": package.checksum,
        "actions": [
            "upsert problem_descriptions",
            "insert problem_revision",
            "replace test_cases",
            "upsert editorial",
        ],
    }


def run_dry_run(catalog_dir: Path) -> int:
    problem_dirs = discover_packages(catalog_dir)
    if not problem_dirs:
        print(f"No problem packages found under {catalog_dir}", file=sys.stderr)
        return 1

    print(f"Dry-run import from {catalog_dir}")
    print(f"Packages discovered: {len(problem_dirs)}")
    print()

    errors: list[str] = []
    plans: list[dict[str, Any]] = []

    for problem_dir in problem_dirs:
        try:
            package = load_problem_package(problem_dir)
            plan = build_import_plan(package)
            plans.append(plan)
            print(f"[ok] {plan['slug']}")
            print(f"     checksum={plan['checksum'][:12]}… tests={plan['test_case_count']} solutions={len(plan['solutions'])}")
        except ValueError as exc:
            errors.append(f"{problem_dir.name}: {exc}")
            print(f"[error] {problem_dir.name}: {exc}", file=sys.stderr)

    print()
    print(json.dumps({"dry_run": True, "packages": plans}, indent=2))

    if errors:
        print(f"\n{len(errors)} package(s) failed validation.", file=sys.stderr)
        return 1

    print("\nDry-run complete. No database changes were made.")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--catalog",
        type=Path,
        default=default_catalog_dir(),
        help="Path to content/catalog (default: repo content/catalog)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    return run_dry_run(args.catalog.resolve())


if __name__ == "__main__":
    raise SystemExit(main())
