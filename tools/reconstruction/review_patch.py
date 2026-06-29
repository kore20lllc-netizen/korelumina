#!/usr/bin/env python3

import subprocess

subprocess.run(
    ["git", "diff", "--stat"],
    check=True,
)
