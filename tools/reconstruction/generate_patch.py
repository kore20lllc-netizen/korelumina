#!/usr/bin/env python3
"""Generate a reconstruction patch scaffold."""

from pathlib import Path
import argparse
import json

parser = argparse.ArgumentParser()
parser.add_argument("--ticket", required=True)
parser.add_argument("--owner", required=True)
parser.add_argument("--capability", required=True)

args = parser.parse_args()

metadata = {
    "ticket": args.ticket,
    "owner": args.owner,
    "capability": args.capability,
}

Path("/tmp/patch_metadata.json").write_text(
    json.dumps(metadata, indent=2)
)

print("Patch metadata generated.")
print("Author your repository patch in /tmp/patch.py.")
