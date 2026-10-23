import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { maskLanguage, scanLanguageRisks } from "../CodeRiskLanguages.js";
import { checkEcosystemDependencies } from "../EcosystemDependencyChecks.js";
import { runRepositoryAudit } from "../RepositoryAudit.js";
import { takeRepositoryInventory } from "../RepositoryInventory.js";
import { takeRepositorySnapshot } from "../RepositorySnapshot.js";

/* MS-2026-0013: every recognised language is scanned, every ecosystem's dependencies are checked, and what was not checked says so. */

function repository(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-any-language-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }
  return root;
}

const rulesFound = (files: Record<string, string>) => scanLanguageRisks(takeRepositorySnapshot(repository(files))).findings.map((finding) => `${finding.evidence[0].file}:${finding.evidence[0].line} ${finding.rule} ${finding.severity}`).sort();

test("the masker tells code from strings and comments in each syntax family", () => {
  const python = 'x = "eval(" # eval(\ny = eval(z)\n';
  const state = maskLanguage(python, "hash");
  assert.equal(state[python.indexOf("eval(z)")], 0);
  assert.equal(state[python.indexOf("eval(")], 1);
  assert.equal(state[python.indexOf("# eval(") + 2], 2);
  const go = '// InsecureSkipVerify: true\ns := `raw InsecureSkipVerify: true`\n/* x */ c := tls.Config{InsecureSkipVerify: true}';
  const goState = maskLanguage(go, "c");
  assert.equal(goState[go.indexOf("InsecureSkipVerify")], 2);
  assert.equal(goState[go.indexOf("raw InsecureSkipVerify")], 1);
  assert.equal(goState[go.lastIndexOf("InsecureSkipVerify")], 0);
  const doc = 'def f():\n    """eval(x) in a docstring"""\n    return 1\n';
  assert.equal(maskLanguage(doc, "hash")[doc.indexOf("eval")], 1);
});

test("risky patterns are found in Python, Go, Java, C#, PHP, Ruby, Rust, C and Dart, and in mobile configuration", () => {
  const found = rulesFound({
    "app/run.py": 'import subprocess, pickle, yaml, requests\nsubprocess.run(cmd, shell=True)\ndata = pickle.loads(blob)\ncfg = yaml.load(text)\nsafe = yaml.load(text, Loader=yaml.SafeLoader)\nrequests.get(url, verify=False)\ncursor.execute(f"SELECT * FROM t WHERE id = {uid}")\n# eval(x) is only a comment\nprint("eval(x) is only text")\n',
    "shop/settings.py": "DEBUG = True\n",
    "svc/main.go": 'cfg := &tls.Config{InsecureSkipVerify: true}\nrows, _ := db.Query(fmt.Sprintf("SELECT * FROM u WHERE n = %s", n))\nexec.Command("sh", "-c", input)\n',
    "api/Repo.java": 'stmt.executeQuery("SELECT * FROM users WHERE id = " + id);\nRuntime.getRuntime().exec(cmd);\n',
    "Api/Data.cs": 'var f = new BinaryFormatter();\nhandler.ServerCertificateCustomValidationCallback = (m, c, ch, e) => true;\n',
    "web/index.php": '<?php\necho "Hello " . $_GET["name"];\nshell_exec("ls " . $dir);\n// eval($code);\n',
    "app/models/user.rb": 'User.where("name = \'#{params[:name]}\'")\nsystem("convert #{file}")\nhtml = text.html_safe\n',
    "src/net.rs": "let c = Client::builder().danger_accept_invalid_certs(true).build();\n",
    "src/io.c": "gets(buffer);\nstrcpy(dst, src);\n",
    "lib/api.dart": "client.badCertificateCallback = (cert, host, port) => true;\n",
    "android/app/src/main/AndroidManifest.xml": '<application android:debuggable="true" android:usesCleartextTraffic="true">\n<!-- android:debuggable="true" -->\n',
    "ios/App/Info.plist": "<key>NSAllowsArbitraryLoads</key>\n<true/>\n",
    "tests/test_api.py": "eval(x)\n",
  });
  assert.deepEqual(found, [
    "Api/Data.cs:1 security.code.dotnet.binary-formatter high",
    "Api/Data.cs:2 security.code.dotnet.tls-verification-disabled high",
    "android/app/src/main/AndroidManifest.xml:1 security.code.android.cleartext-traffic medium",
    "android/app/src/main/AndroidManifest.xml:1 security.code.android.debuggable high",
    "api/Repo.java:1 security.code.jvm.sql-string-building high",
    "api/Repo.java:2 security.code.jvm.runtime-exec medium",
    "app/models/user.rb:1 security.code.ruby.sql-interpolation high",
    "app/models/user.rb:2 security.code.ruby.shell-interpolation high",
    "app/models/user.rb:3 security.code.ruby.unescaped-html medium",
    "app/run.py:2 security.code.python.shell-true high",
    "app/run.py:3 security.code.python.pickle medium",
    "app/run.py:4 security.code.python.yaml-load medium",
    "app/run.py:6 security.code.python.tls-verification-disabled high",
    "app/run.py:7 security.code.python.sql-string-building high",
    "ios/App/Info.plist:1 security.code.ios.arbitrary-loads medium",
    "lib/api.dart:1 security.code.dart.tls-verification-disabled high",
    "shop/settings.py:1 security.code.python.django-debug medium",
    "src/io.c:1 security.code.c.gets high",
    "src/io.c:2 security.code.c.unbounded-string low",
    "src/net.rs:1 security.code.rust.tls-verification-disabled high",
    "svc/main.go:1 security.code.go.tls-verification-disabled high",
    "svc/main.go:2 security.code.go.sql-string-building high",
    "svc/main.go:3 security.code.go.shell medium",
    "tests/test_api.py:1 security.code.python.eval low",
    "web/index.php:2 security.code.php.echo-input high",
    "web/index.php:3 security.code.php.shell high",
  ]);
});

test("other ecosystems' manifests are checked for lockfiles, unpinned versions and parse errors", () => {
  const inventory = takeRepositoryInventory(takeRepositorySnapshot(repository({
    "api/pyproject.toml": '[tool.poetry]\nname = "api"\n[tool.poetry.dependencies]\npython = "^3.11"\nfastapi = "*"\n',
    "worker/requirements.txt": "celery\nredis==5.0.1\n",
    "svc/go.mod": "module x\nrequire github.com/a/b v1.0.0\n",
    "pinned/go.mod": "module y\nrequire github.com/a/b v1.0.0\n",
    "pinned/go.sum": "",
    "web/composer.json": "{ broken",
    "server/pom.xml": "<project><artifactId>s</artifactId><dependencies><dependency><groupId>g</groupId><artifactId>managed</artifactId></dependency></dependencies></project>",
  })));
  const findings = checkEcosystemDependencies(inventory.ecosystems).map((finding) => `${finding.packageDirectory} ${finding.rule} ${finding.severity}`).sort();
  assert.deepEqual(findings, [
    "api dependency.lockfile-missing medium",
    "api dependency.unpinned low",
    "svc dependency.lockfile-missing medium",
    "web dependency.manifest-unreadable medium",
    "worker dependency.unpinned low",
  ]);
});

test("an audit of a mixed repository says what it covered and marks the rest partial or not checked", async () => {
  const mixed = await runRepositoryAudit({
    projectId: "mixed",
    root: repository({
      "package.json": JSON.stringify({ name: "web", dependencies: { react: "^18" } }),
      "package-lock.json": "{}",
      "src/main.ts": 'import React from "react";\nexport default React;\n',
      "api/pyproject.toml": '[project]\nname = "api"\ndependencies = ["fastapi>=0.110"]\n',
      "api/main.py": "import fastapi\n",
      "tools/ios/Thing.swift": "let x = 1\n",
    }),
    mode: "scan",
    checkAdvisories: false,
    now: () => 1,
  });
  const category = (name: string) => mixed.summary.categories.find((entry) => entry.category === name)!;
  assert.equal(category("dependency").status, "partial");
  assert.match(category("dependency").notes.join(" "), /For Python, manifests and lockfiles were checked/);
  assert.match(category("dependency").notes.join(" "), /Swift code has no manifest/);
  assert.equal(category("security").status, "partial");
  assert.match(category("security").notes.join(" "), /Python dependencies were not checked against OSV: the advisory check was turned off for this run/);
  assert.match(category("security").notes.join(" "), /Swift code was not scanned for risky patterns/);
  assert.equal(category("architecture").status, "partial");
  assert.match(category("architecture").notes[0], /Python and Swift code is not covered/);

  const python = await runRepositoryAudit({
    projectId: "py",
    root: repository({ "requirements.txt": "flask==3.0.0\n", "app.py": "import flask\n" }),
    mode: "deep",
    checkAdvisories: false,
    runProcess: async () => ({ exitCode: 0, stdout: "", stderr: "", timedOut: false }),
    now: () => 1,
  });
  const pyCategory = (name: string) => python.summary.categories.find((entry) => entry.category === name)!;
  assert.equal(pyCategory("architecture").status, "not-checked");
  assert.equal(pyCategory("architecture").score, null);
  assert.equal(pyCategory("environment").status, "not-checked");
  assert.equal(pyCategory("build").status, "not-checked");
  assert.match(pyCategory("build").notes.join(" "), /Python was not built/);
});
