#!/usr/bin/env python3

from __future__ import annotations

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


def run(
    root: Path,
    command: list[str],
) -> None:
    print(f"$ {' '.join(command)}")

    subprocess.run(
        command,
        cwd=root,
        check=True,
    )


def main() -> int:
    try:
        root = repository_root()

        run(
            root,
            ["git", "diff", "--check"],
        )

        conflict_scan = subprocess.run(
            [
                "git",
                "grep",
                "-n",
                "-E",
                "^(<<<<<<<|=======|>>>>>>>)",
                "--",
                ".",
                ":(exclude)package-lock.json",
            ],
            cwd=root,
            capture_output=True,
            text=True,
        )

        if conflict_scan.returncode == 0:
            print(
                "Conflict markers found:\n"
                f"{conflict_scan.stdout}",
                file=sys.stderr,
            )
            return 1

        if conflict_scan.returncode not in (0, 1):
            print(
                conflict_scan.stderr,
                file=sys.stderr,
            )
            return conflict_scan.returncode

        run(
            root,
            ["npm", "run", "build"],
        )

        run(
            root,
            ["git", "status", "--short"],
        )

        print("Reconstruction validation succeeded.")
        return 0

    except subprocess.CalledProcessError as error:
        print(
            f"Validation failed with exit code "
            f"{error.returncode}.",
            file=sys.stderr,
        )
        return error.returncode


if __name__ == "__main__":
    raise SystemExit(main())
