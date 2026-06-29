#!/usr/bin/env python3

import subprocess
import sys

subprocess.run(
    [sys.executable, "/tmp/patch.py"],
    check=True,
)
