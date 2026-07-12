#!/usr/bin/env python3

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def repository_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=True,
        capture_output=True,
        text=True,
    )
    return Path(result.stdout.strip())


def read_patch(patch_file: str | None) -> str:
    if patch_file:
        return Path(patch_file).read_text(encoding="utf-8")

    return sys.stdin.read()


def run_git_apply(
    root: Path,
    patch_text: str,
    *,
    check_only: bool,
) -> None:
    command = [
        "git",
        "apply",
        "--recount",
        "--whitespace=error-all",
    ]

    if check_only:
        command.append("--check")

    result = subprocess.run(
        command,
        cwd=root,
        input=patch_text,
        text=True,
        capture_output=True,
    )

    if result.returncode != 0:
        diagnostic = (
            result.stderr.strip()
            or result.stdout.strip()
            or "git apply failed"
        )

        raise RuntimeError(diagnostic)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Apply a unified diff atomically after validating "
            "the complete patch."
        ),
    )

    parser.add_argument(
        "patch_file",
        nargs="?",
        help=(
            "Optional unified diff file. When omitted, the patch "
            "is read from standard input."
        ),
    )

    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate the patch without modifying the repository.",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        root = repository_root()
        patch_text = read_patch(args.patch_file)

        if not patch_text.strip():
            raise RuntimeError("Patch input is empty.")

        run_git_apply(
            root,
            patch_text,
            check_only=True,
        )

        if args.check:
            print("Patch validation succeeded.")
            return 0

        run_git_apply(
            root,
            patch_text,
            check_only=False,
        )

        print("Patch applied successfully.")
        return 0

    except (
        OSError,
        RuntimeError,
        subprocess.CalledProcessError,
    ) as error:
        print(
            f"Patch failed: {error}",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
