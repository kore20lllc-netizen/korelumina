#!/usr/bin/env python3

import subprocess

subprocess.run(
    ["npm", "run", "build"],
    check=True,
)

subprocess.run(
    ["git", "status"],
    check=True,
)
