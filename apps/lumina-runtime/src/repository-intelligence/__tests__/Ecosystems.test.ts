import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import type { EcosystemPackage } from "../Ecosystems.js";
import { parseSimpleYaml, parseToml } from "../ManifestParsers.js";
import { takeRepositoryInventory } from "../RepositoryInventory.js";
import { takeRepositorySnapshot } from "../RepositorySnapshot.js";

/* MS-2026-0013: every recognised ecosystem's packages are read from their manifests; nothing else is guessed. */

export function repository(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-ecosystems-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }
  return root;
}

function inventoryOf(files: Record<string, string>) {
  return takeRepositoryInventory(takeRepositorySnapshot(repository(files)));
}

function only(packages: EcosystemPackage[], ecosystem: string): EcosystemPackage {
  const found = packages.filter((entry) => entry.ecosystem === ecosystem);
  assert.equal(found.length, 1, `${ecosystem}: ${JSON.stringify(found.map((entry) => entry.manifests))}`);
  return found[0];
}

const dep = (entry: EcosystemPackage, name: string) => entry.dependencies.find((dependency) => dependency.name === name);

test("the TOML and YAML readers handle what manifests contain", () => {
  const toml = parseToml(`
# comment
[package]
name = "svc" # trailing
version = "0.1.0"
[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = "1"
[dependencies.axum]
version = "0.7"
[[bin]]
name = "a"
[[bin]]
name = "b"
[project]
dependencies = [
  "fastapi>=0.110",   # web
  'uvicorn[standard]',
]
`);
  assert.deepEqual(toml.package, { name: "svc", version: "0.1.0" });
  assert.deepEqual((toml.dependencies as Record<string, unknown>).serde, { version: "1.0", features: ["derive"] });
  assert.deepEqual((toml.dependencies as Record<string, unknown>).axum, { version: "0.7" });
  assert.equal((toml.bin as unknown[]).length, 2);
  assert.deepEqual((toml.project as Record<string, unknown>).dependencies, ["fastapi>=0.110", "uvicorn[standard]"]);
  const yaml = parseSimpleYaml("name: app\ndependencies:\n  flutter:\n    sdk: flutter\n  http: ^1.2.0\n  # note\n  provider: '6.1.1'\ndev_dependencies:\n  lints: ^3.0.0\n");
  assert.deepEqual(yaml, { name: "app", dependencies: { flutter: { sdk: "flutter" }, http: "^1.2.0", provider: "6.1.1" }, dev_dependencies: { lints: "^3.0.0" } });
});

test("Python: pyproject (PEP 621 and Poetry), requirements files and the lockfile's tool", () => {
  const poetry = only(inventoryOf({
    "pyproject.toml": '[tool.poetry]\nname = "shop"\nversion = "1.2.0"\n[tool.poetry.dependencies]\npython = "^3.11"\ndjango = "^5.0"\n[tool.poetry.group.dev.dependencies]\npytest = "^8"\n',
    "poetry.lock": "",
    "requirements/dev.txt": "black==24.1\n",
    "app/views.py": "x = 1\n",
  }).ecosystems, "python");
  assert.equal(poetry.name, "shop");
  assert.equal(poetry.tool, "poetry");
  assert.deepEqual(poetry.lockfiles, ["poetry.lock"]);
  assert.deepEqual(dep(poetry, "django"), { name: "django", spec: "^5.0", scope: "runtime" });
  assert.equal(dep(poetry, "python"), undefined);
  assert.equal(dep(poetry, "pytest")?.scope, "development");
  assert.equal(dep(poetry, "black")?.scope, "development");
  assert.deepEqual(poetry.frameworks, ["Django"]);

  const pep = only(inventoryOf({
    "pyproject.toml": '[project]\nname = "api"\nversion = "0.3"\ndependencies = ["FastAPI>=0.110", "pydantic_settings ; python_version >= \'3.9\'"]\n[project.optional-dependencies]\ntest = ["pytest"]\n',
    "requirements.txt": "# pinned\n-r base.txt\nrequests==2.32.3  # http\n",
    "uv.lock": "",
  }).ecosystems, "python");
  assert.equal(pep.tool, "uv");
  assert.deepEqual(dep(pep, "fastapi"), { name: "fastapi", spec: ">=0.110", scope: "runtime" });
  assert.equal(dep(pep, "pydantic-settings")?.spec, null);
  assert.equal(dep(pep, "pytest")?.scope, "optional");
  assert.equal(dep(pep, "requests")?.spec, "==2.32.3");
  assert.deepEqual(pep.frameworks, ["FastAPI"]);
});

test("Go, Rust and PHP read their manifests and lockfiles", () => {
  const inventory = inventoryOf({
    "go.mod": "module github.com/acme/api\n\ngo 1.22\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.10.0\n\tgolang.org/x/net v0.25.0 // indirect\n)\nrequire github.com/google/uuid v1.6.0\n",
    "go.sum": "",
    "engine/Cargo.toml": '[package]\nname = "engine"\nversion = "0.2.0"\n[dependencies]\naxum = "0.7"\nserde = { version = "1", features = ["derive"] }\n[dev-dependencies]\ninsta = "1"\n',
    "engine/Cargo.lock": "",
    "web/composer.json": JSON.stringify({ name: "acme/web", require: { php: "^8.2", "ext-json": "*", "laravel/framework": "^11.0" }, "require-dev": { "phpunit/phpunit": "^11" } }),
    "web/composer.lock": "{}",
  });
  const go = only(inventory.ecosystems, "go");
  assert.equal(go.name, "github.com/acme/api");
  assert.equal(go.version, "1.22");
  assert.deepEqual(go.lockfiles, ["go.sum"]);
  assert.equal(dep(go, "golang.org/x/net")?.scope, "indirect");
  assert.equal(dep(go, "github.com/google/uuid")?.spec, "v1.6.0");
  assert.deepEqual(go.frameworks, ["Gin"]);
  const rust = only(inventory.ecosystems, "rust");
  assert.equal(rust.directory, "engine");
  assert.deepEqual(rust.lockfiles, ["engine/Cargo.lock"]);
  assert.equal(dep(rust, "serde")?.spec, "1");
  assert.equal(dep(rust, "insta")?.scope, "development");
  assert.deepEqual(rust.frameworks, ["Axum"]);
  const php = only(inventory.ecosystems, "php");
  assert.deepEqual(php.dependencies.map((entry) => entry.name), ["laravel/framework", "phpunit/phpunit"]);
  assert.deepEqual(php.frameworks, ["Laravel"]);
  assert.deepEqual(php.lockfiles, ["web/composer.lock"]);
});

test("Java and Kotlin: Maven and Gradle, including Android and Spring Boot", () => {
  const inventory = inventoryOf({
    "server/pom.xml": `<project><parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId><version>3.3.0</version></parent>
<groupId>com.acme</groupId><artifactId>server</artifactId><version>1.0.0</version>
<!-- <dependency><artifactId>commented</artifactId></dependency> -->
<dependencies>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
<dependency><groupId>org.junit.jupiter</groupId><artifactId>junit-jupiter</artifactId><version>5.10.2</version><scope>test</scope></dependency>
</dependencies></project>`,
    "android/settings.gradle.kts": 'rootProject.name = "acme-mobile"\ninclude(":app")\n',
    "android/build.gradle.kts": 'plugins { id("com.android.application") version "8.4.0" }\n',
    "android/app/build.gradle.kts": 'dependencies {\n  implementation("androidx.core:core-ktx:1.13.1")\n  testImplementation("junit:junit:4.13.2")\n  implementation(platform("androidx.compose:compose-bom:2024.05.00"))\n}\n',
  });
  const jvm = inventory.ecosystems.filter((entry) => entry.ecosystem === "jvm");
  const maven = jvm.find((entry) => entry.tool === "maven")!;
  assert.equal(maven.name, "com.acme:server");
  assert.equal(maven.version, "1.0.0");
  assert.deepEqual(maven.dependencies.map((entry) => [entry.name, entry.scope]), [["org.springframework.boot:spring-boot-starter-web", "runtime"], ["org.junit.jupiter:junit-jupiter", "development"]]);
  assert.deepEqual(maven.frameworks, ["Spring Boot"]);
  const root = jvm.find((entry) => entry.directory === "android")!;
  assert.equal(root.name, "acme-mobile");
  assert.deepEqual(root.frameworks, ["Android"]);
  const app = jvm.find((entry) => entry.directory === "android/app")!;
  assert.deepEqual(app.dependencies.map((entry) => [entry.name, entry.spec, entry.scope]), [["androidx.core:core-ktx", "1.13.1", "runtime"], ["junit:junit", "4.13.2", "development"]]);
});

test(".NET, Ruby, Swift, Dart and C/C++ read their manifests", () => {
  const inventory = inventoryOf({
    "src/Api/Api.csproj": '<Project Sdk="Microsoft.NET.Sdk.Web"><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup><ItemGroup><PackageReference Include="Serilog" Version="3.1.1" /><PackageReference Include="StyleCop.Analyzers" Version="1.1.118"><PrivateAssets>all</PrivateAssets></PackageReference></ItemGroup></Project>',
    "src/Api/Program.cs": "var app = 1;\n",
    "Gemfile": 'source "https://rubygems.org"\ngem "rails", "~> 7.1"\ngem "pg"\ngroup :development, :test do\n  gem "rspec-rails"\nend\ngem "puma", group: :development\n',
    "Gemfile.lock": "",
    "ios/Package.swift": 'let package = Package(name: "AcmeKit", dependencies: [ .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.9.0") ])',
    "ios/Podfile": "platform :ios, '15.0'\npod 'Firebase/Analytics', '~> 10.0'\n",
    "ios/App.xcodeproj/project.pbxproj": 'repositoryURL = "https://github.com/pointfreeco/swift-composable-architecture";',
    "mobile/pubspec.yaml": "name: acme_app\nversion: 1.0.0+1\ndependencies:\n  flutter:\n    sdk: flutter\n  http: ^1.2.0\ndev_dependencies:\n  flutter_test:\n    sdk: flutter\n  lints: ^3.0.0\nflutter:\n  uses-material-design: true\n",
    "native/CMakeLists.txt": "cmake_minimum_required(VERSION 3.20)\nproject(engine VERSION 2.1 LANGUAGES CXX)\nfind_package(Boost 1.80 REQUIRED)\nadd_subdirectory(lib)\n",
    "native/lib/CMakeLists.txt": "add_library(core core.cpp)\n",
    "native/lib/core.cpp": "int main() {}\n",
    "native/vcpkg.json": JSON.stringify({ name: "engine", dependencies: ["fmt", { name: "zlib" }] }),
    "tools/Makefile": "all:\n\techo hi\n",
  });
  const dotnet = only(inventory.ecosystems, "dotnet");
  assert.equal(dotnet.name, "Api");
  assert.equal(dotnet.version, "net8.0");
  assert.deepEqual(dotnet.dependencies.map((entry) => [entry.name, entry.scope]), [["Serilog", "runtime"], ["StyleCop.Analyzers", "build"]]);
  assert.deepEqual(dotnet.frameworks, ["ASP.NET Core"]);
  const ruby = only(inventory.ecosystems, "ruby");
  assert.deepEqual(ruby.dependencies.map((entry) => [entry.name, entry.scope]), [["pg", "runtime"], ["rails", "runtime"], ["puma", "development"], ["rspec-rails", "development"]]);
  assert.deepEqual(ruby.frameworks, ["Ruby on Rails"]);
  const swift = only(inventory.ecosystems, "swift");
  assert.equal(swift.directory, "ios");
  assert.equal(swift.name, "AcmeKit");
  assert.equal(swift.tool, "cocoapods+swiftpm+xcode");
  assert.deepEqual(swift.dependencies.map((entry) => entry.name), ["Alamofire", "Firebase/Analytics", "swift-composable-architecture"]);
  const dart = only(inventory.ecosystems, "dart");
  assert.equal(dart.tool, "flutter");
  assert.deepEqual(dart.dependencies.map((entry) => [entry.name, entry.scope]), [["http", "runtime"], ["lints", "development"]]);
  assert.deepEqual(dart.frameworks, ["Flutter"]);
  const c = only(inventory.ecosystems, "c-cpp");
  assert.equal(c.directory, "native");
  assert.equal(c.name, "engine");
  assert.equal(c.version, "2.1");
  assert.equal(c.tool, "cmake+vcpkg");
  assert.deepEqual(c.dependencies.map((entry) => entry.name), ["fmt", "zlib", "Boost"]);
});

test("Node packages appear beside the others, and code without a manifest or in an unsupported language is named, not guessed", () => {
  const inventory = inventoryOf({
    "package.json": JSON.stringify({ name: "web", dependencies: { react: "^18" }, devDependencies: { vite: "^5" } }),
    "package-lock.json": "{}",
    "src/main.tsx": "export {};\n",
    "scripts/report.py": "print(1)\n",
    "lib/worker.ex": "defmodule W do end\n",
    "README.md": "# web\n",
  });
  const node = only(inventory.ecosystems, "node");
  assert.equal(node.tool, "npm");
  assert.deepEqual(node.lockfiles, ["package-lock.json"]);
  assert.deepEqual(node.dependencies, [{ name: "react", spec: "^18", scope: "runtime" }, { name: "vite", spec: "^5", scope: "development" }]);
  assert.deepEqual(inventory.ecosystemCoverage, { recognised: ["node"], languagesWithoutManifest: ["Python"], unsupportedLanguages: ["Elixir"] });
});

test("installed dependencies and build output of other ecosystems are not read as the repository", () => {
  const inventory = inventoryOf({
    "requirements.txt": "flask\n",
    ".venv/lib/site-packages/flask/pyproject.toml": '[project]\nname = "flask"\n',
    "target/debug/build/Cargo.toml": '[package]\nname = "x"\n',
    "ios/Pods/Thing/Podfile": "pod 'X'\n",
  });
  assert.deepEqual(inventory.ecosystems.map((entry) => entry.manifests), [["requirements.txt"]]);
});

test("a broken manifest is reported, never fatal", () => {
  const inventory = inventoryOf({ "web/composer.json": "{ not json", "go.mod": "module x\n" });
  assert.match(only(inventory.ecosystems, "php").parseErrors[0], /^web\/composer\.json: /);
  assert.equal(only(inventory.ecosystems, "go").name, "x");
});
