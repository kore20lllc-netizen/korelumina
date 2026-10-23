import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { resolveVersions } from "../LockfileVersions.js";
import { auditOsvAdvisories, cvss3BaseScore, osvEnabled, osvSeverity, type OsvFetch } from "../OsvAdvisories.js";
import { runRepositoryAudit } from "../RepositoryAudit.js";
import { takeRepositoryInventory } from "../RepositoryInventory.js";
import { takeRepositorySnapshot } from "../RepositorySnapshot.js";

/* MS-2026-0013: advisories for every ecosystem npm audit does not cover, from OSV, by exact version. */

function repository(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-osv-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }
  return root;
}

function resolvedFrom(files: Record<string, string>) {
  const snapshot = takeRepositorySnapshot(repository(files));
  return resolveVersions(takeRepositoryInventory(snapshot).ecosystems, snapshot.read);
}

const FIXTURE: Record<string, string> = {
  "api/pyproject.toml": '[tool.poetry]\nname = "api"\n[tool.poetry.dependencies]\ndjango = "^4.2"\n',
  "api/poetry.lock": '[[package]]\nname = "Django"\nversion = "4.2.1"\n\n[[package]]\nname = "sqlparse"\nversion = "0.4.3"\n',
  "worker/requirements.txt": "celery==5.3.0\nredis>=5\n",
  "svc/go.mod": "module x\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.0\n\tgolang.org/x/net v0.10.0 // indirect\n)\n",
  "svc/go.sum": "",
  "engine/Cargo.toml": '[package]\nname = "engine"\n[dependencies]\nhyper = "0.14"\n',
  "engine/Cargo.lock": '[[package]]\nname = "engine"\nversion = "0.1.0"\n\n[[package]]\nname = "hyper"\nversion = "0.14.10"\nsource = "registry+https://github.com/rust-lang/crates.io-index"\n',
  "web/composer.json": JSON.stringify({ require: { "laravel/framework": "^10" } }),
  "web/composer.lock": JSON.stringify({ packages: [{ name: "laravel/framework", version: "v10.0.0" }], "packages-dev": [{ name: "phpunit/phpunit", version: "10.1.0" }] }),
  "Gemfile": 'gem "rails"\n',
  "Gemfile.lock": "GEM\n  remote: https://rubygems.org/\n  specs:\n    rails (7.0.4)\n      actionpack (= 7.0.4)\n    nokogiri (1.14.0-x86_64-linux)\n\nPLATFORMS\n  ruby\n",
  "mobile/pubspec.yaml": "name: app\ndependencies:\n  http: ^0.13.0\n",
  "mobile/pubspec.lock": 'packages:\n  http:\n    dependency: "direct main"\n    source: hosted\n    version: "0.13.5"\n  flutter:\n    dependency: "direct main"\n    source: sdk\n    version: "0.0.0"\n',
  "Api/Api.csproj": '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="Newtonsoft.Json" Version="12.0.1" /><PackageReference Include="Serilog" Version="[3.0,4.0)" /></ItemGroup></Project>',
  "server/pom.xml": "<project><artifactId>s</artifactId><dependencies><dependency><groupId>org.apache.logging.log4j</groupId><artifactId>log4j-core</artifactId><version>2.14.1</version></dependency><dependency><groupId>g</groupId><artifactId>managed</artifactId><version>${v}</version></dependency></dependencies></project>",
  "ios/Package.swift": 'let package = Package(name: "Kit", dependencies: [.package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.0.0")])',
  "ios/Package.resolved": JSON.stringify({ pins: [{ identity: "alamofire", location: "https://github.com/Alamofire/Alamofire.git", state: { version: "5.6.1" } }], version: 2 }),
  "pods/Podfile": "pod 'Firebase'\n",
};

test("exact versions come from each ecosystem's lockfile, then from exact pins; ranges are never guessed", () => {
  const { versions, unresolved } = resolvedFrom(FIXTURE);
  const got = versions.map((entry) => `${entry.ecosystem} ${entry.name}@${entry.version}`).sort();
  assert.deepEqual(got, [
    "Go github.com/gin-gonic/gin@1.9.0",
    "Go golang.org/x/net@0.10.0",
    "Maven org.apache.logging.log4j:log4j-core@2.14.1",
    "NuGet Newtonsoft.Json@12.0.1",
    "Packagist laravel/framework@10.0.0",
    "Packagist phpunit/phpunit@10.1.0",
    "Pub http@0.13.5",
    "PyPI celery@5.3.0",
    "PyPI django@4.2.1",
    "PyPI sqlparse@0.4.3",
    "RubyGems nokogiri@1.14.0",
    "RubyGems rails@7.0.4",
    "SwiftURL https://github.com/Alamofire/Alamofire@5.6.1",
    "crates.io hyper@0.14.10",
  ]);
  assert.deepEqual(unresolved, [{ packageDirectory: "pods", ecosystem: "swift", reason: "CocoaPods is not in the advisory database" }]);
});

test("CVSS v3 base scores and advisory severities", () => {
  assert.equal(cvss3BaseScore("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"), 9.8);
  assert.equal(cvss3BaseScore("CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N"), 6.1);
  assert.equal(cvss3BaseScore("CVSS:3.0/AV:L/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N"), 1.8);
  assert.equal(cvss3BaseScore("CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N"), null);
  assert.deepEqual(osvSeverity({ id: "GHSA-1", database_specific: { severity: "MODERATE" } }), { severity: "medium", rated: true });
  assert.deepEqual(osvSeverity({ id: "X", severity: [{ type: "CVSS_V3", score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" }] }), { severity: "critical", rated: true });
  assert.deepEqual(osvSeverity({ id: "Y" }), { severity: "medium", rated: false });
  assert.equal(osvEnabled({}), true);
  assert.equal(osvEnabled({ KORELUMINA_OSV_ADVISORIES: "off" }), false);
});

function fakeOsv(vulnerable: Record<string, string[]>, details: Record<string, unknown>, sent: unknown[] = []): OsvFetch {
  return async (url, init) => {
    if (url.endsWith("/querybatch")) {
      const body = JSON.parse(init!.body!) as { queries: { package: { name: string; ecosystem: string }; version: string }[] };
      sent.push(body);
      return { ok: true, status: 200, json: async () => ({ results: body.queries.map((query) => ({ vulns: (vulnerable[`${query.package.name}@${query.version}`] ?? []).map((id) => ({ id })) })) }) };
    }
    const id = decodeURIComponent(url.split("/").pop()!);
    return { ok: true, status: 200, json: async () => details[id] };
  };
}

test("vulnerable versions become findings with the worst severity, CVE aliases and fixed versions; only names and versions are sent", async () => {
  const sent: unknown[] = [];
  const osv = fakeOsv(
    { "org.apache.logging.log4j:log4j-core@2.14.1": ["GHSA-jfh8-c2jp-5v3q"], "django@4.2.1": ["PYSEC-1", "GHSA-low"] },
    {
      "GHSA-jfh8-c2jp-5v3q": { id: "GHSA-jfh8-c2jp-5v3q", summary: "Remote code injection in Log4j", aliases: ["CVE-2021-44228"], database_specific: { severity: "CRITICAL" }, affected: [{ package: { name: "org.apache.logging.log4j:log4j-core" }, ranges: [{ events: [{ introduced: "2.0" }, { fixed: "2.15.0" }] }] }] },
      "PYSEC-1": { id: "PYSEC-1", summary: "SQL injection", severity: [{ type: "CVSS_V3", score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N" }], affected: [{ package: { name: "django" }, ranges: [{ events: [{ fixed: "4.2.2" }] }] }] },
      "GHSA-low": { id: "GHSA-low", summary: "minor", database_specific: { severity: "LOW" } },
    },
    sent,
  );
  const { versions } = resolvedFrom(FIXTURE);
  const result = await auditOsvAdvisories(versions, { fetch: osv, now: () => 7 });
  assert.equal(result.status, "checked");
  assert.equal(result.packagesChecked, versions.length);
  const byTitle = Object.fromEntries(result.findings.map((finding) => [finding.title, finding]));
  const log4j = byTitle["org.apache.logging.log4j:log4j-core 2.14.1: Remote code injection in Log4j"];
  assert.equal(log4j.severity, "critical");
  assert.match(log4j.detail, /GHSA-jfh8-c2jp-5v3q \/ CVE-2021-44228/);
  assert.match(log4j.remedy ?? "", /2\.15\.0/);
  assert.equal(log4j.packageDirectory, "server");
  const django = byTitle["django 4.2.1: SQL injection and 1 more"];
  assert.equal(django.severity, "high");
  assert.deepEqual(django.evidence, [{ file: "api/poetry.lock" }]);
  const query = JSON.stringify(sent);
  assert.equal(query.includes("pyproject"), false);
  assert.deepEqual(Object.keys((sent[0] as { queries: Record<string, unknown>[] }).queries[0]).sort(), ["package", "version"]);
});

test("when OSV cannot be reached, or is turned off, advisories are not checked, never clean", async () => {
  const { versions } = resolvedFrom(FIXTURE);
  const down = await auditOsvAdvisories(versions, { fetch: async () => ({ ok: false, status: 503, json: async () => ({}) }) });
  assert.equal(down.status, "unavailable");
  assert.match(down.reason ?? "", /OSV could not be reached \(OSV answered 503\)/);
  const off = await auditOsvAdvisories(versions, { enabled: false });
  assert.equal(off.status, "off");

  const report = await runRepositoryAudit({ projectId: "p", root: repository(FIXTURE), mode: "scan", osvFetch: async () => { throw new Error("getaddrinfo ENOTFOUND api.osv.dev"); }, runAudit: async () => ({ stdout: "", stderr: "", exitCode: 1, timedOut: false }), now: () => 1 });
  const security = report.summary.categories.find((entry) => entry.category === "security")!;
  assert.equal(security.status, "partial");
  assert.match(security.notes.join(" "), /were not checked against OSV: OSV could not be reached \(getaddrinfo ENOTFOUND api\.osv\.dev\)/);
  assert.equal(report.coverage.osvAdvisories?.status, "unavailable");
});

test("an audit that reaches OSV adds its findings and names only what could not be resolved", async () => {
  const report = await runRepositoryAudit({
    projectId: "p",
    root: repository(FIXTURE),
    mode: "scan",
    osvFetch: fakeOsv({ "hyper@0.14.10": ["RUSTSEC-2023-0001"] }, { "RUSTSEC-2023-0001": { id: "RUSTSEC-2023-0001", summary: "Request smuggling", database_specific: { severity: "HIGH" } } }),
    runAudit: async () => ({ stdout: "", stderr: "", exitCode: 1, timedOut: false }),
    now: () => 1,
  });
  assert.ok(report.findings.some((finding) => finding.title === "hyper 0.14.10: Request smuggling" && finding.severity === "high"));
  const security = report.summary.categories.find((entry) => entry.category === "security")!;
  assert.match(security.notes.join(" "), /Advisories were not checked for Swift in pods \(CocoaPods is not in the advisory database\)/);
  assert.equal(report.coverage.osvAdvisories?.packagesChecked, 14);
});
