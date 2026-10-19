import assert from "node:assert/strict";
import test from "node:test";

import { projectProcessEnvironment } from "../projectProcessEnvironment.js";

/* SEC-1 (F-18): project code never receives Runtime's secrets. */

const runtimeEnvironment = {
  PATH: "/usr/local/bin:/usr/bin",
  HOME: "/Users/owner",
  LANG: "en_US.UTF-8",
  LC_ALL: "en_US.UTF-8",
  TMPDIR: "/tmp/owner",
  HTTPS_PROXY: "http://proxy.local:3128",
  OPENAI_API_KEY: "sk-runtime-secret",
  ANTHROPIC_API_KEY: "sk-ant-runtime-secret",
  KORELUMINA_RUNTIME_INTERNAL_TOKEN: "internal-token",
  KORELUMINA_EXECUTIVE_ROOT: "/Users/owner/korelumina/runtime/executive",
  LUMINA_EXECUTIVE_MUTATION_ENABLED: "true",
  GITHUB_TOKEN: "ghp_secret",
  AWS_SECRET_ACCESS_KEY: "aws-secret",
  NPM_TOKEN: "npm-secret",
  npm_config__authToken: "npm-secret",
  NODE_OPTIONS: "--require /Users/owner/hook.js",
};

test("keeps what tools need and drops every secret", () => {
  const environment = projectProcessEnvironment({}, runtimeEnvironment);

  assert.deepEqual(Object.keys(environment).sort(), [
    "HOME",
    "HTTPS_PROXY",
    "LANG",
    "LC_ALL",
    "PATH",
    "TMPDIR",
  ]);

  for (const secret of [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "KORELUMINA_RUNTIME_INTERNAL_TOKEN",
    "KORELUMINA_EXECUTIVE_ROOT",
    "LUMINA_EXECUTIVE_MUTATION_ENABLED",
    "GITHUB_TOKEN",
    "AWS_SECRET_ACCESS_KEY",
    "NPM_TOKEN",
    "npm_config__authToken",
    "NODE_OPTIONS",
  ]) {
    assert.equal(environment[secret], undefined, `${secret} must not reach project code`);
  }
});

test("the launcher's own settings are applied on top", () => {
  const environment = projectProcessEnvironment(
    { NODE_ENV: "development", PORT: "5173", PATH: "/override" },
    runtimeEnvironment,
  );

  assert.equal(environment.NODE_ENV, "development");
  assert.equal(environment.PORT, "5173");
  assert.equal(environment.PATH, "/override");
  assert.equal(environment.OPENAI_API_KEY, undefined);
});

test("by default it reads Runtime's real environment without leaking it", () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "sk-test-only";
  try {
    const environment = projectProcessEnvironment({ CI: "true" });
    assert.equal(environment.OPENAI_API_KEY, undefined);
    assert.equal(environment.CI, "true");
    assert.equal(environment.PATH, process.env.PATH);
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  }
});
