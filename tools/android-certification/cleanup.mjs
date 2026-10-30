import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
assert.equal(process.env.RUNNER_ENVIRONMENT, 'github-hosted');
assert(process.env.RUNNER_TEMP && path.isAbsolute(process.env.RUNNER_TEMP));
// No global Docker prune or deletion of unrelated paths. Provider disposes the VM.
fs.rmSync(path.join(process.env.RUNNER_TEMP, 'klm-android-private'), { recursive: true, force: true });
