import path from "node:path";

import {
  parseSimpleYaml,
  parseToml,
  tomlGet,
  withoutXmlComments,
  xmlAttribute,
  xmlBlocks,
  xmlText,
  type TomlTable,
  type TomlValue,
  type YamlMap,
} from "./ManifestParsers.js";

/*
 * MS-2026-0013 (Import any repository, any language): the packages of
 * every recognised ecosystem in a repository, read from their manifests.
 *
 * Recognised: Node (from the workspace inventory), Python, Go, Rust, Java
 * and Kotlin (Maven, Gradle), .NET, PHP, Ruby, Swift (SwiftPM, CocoaPods,
 * Xcode), Dart and Flutter, C and C++ (CMake, Meson, vcpkg, Conan, Make).
 * Nothing is executed. Code in a language with no recognised manifest is
 * reported as such; it is never guessed into an ecosystem.
 */

export type Ecosystem = "node" | "python" | "go" | "rust" | "jvm" | "dotnet" | "php" | "ruby" | "swift" | "dart" | "c-cpp";

export const ECOSYSTEM_LABEL: Record<Ecosystem, string> = {
  node: "Node.js",
  python: "Python",
  go: "Go",
  rust: "Rust",
  jvm: "Java and Kotlin",
  dotnet: ".NET",
  php: "PHP",
  ruby: "Ruby",
  swift: "Swift",
  dart: "Dart and Flutter",
  "c-cpp": "C and C++",
};

export type DependencyScope = "runtime" | "development" | "optional" | "build" | "indirect";

export interface EcosystemDependency {
  name: string;
  spec: string | null;
  scope: DependencyScope;
}

export interface EcosystemPackage {
  ecosystem: Ecosystem;
  /* Directory relative to the repository root; "." for the root. */
  directory: string;
  manifests: string[];
  name: string | null;
  version: string | null;
  tool: string | null;
  lockfiles: string[];
  dependencies: EcosystemDependency[];
  frameworks: string[];
  parseErrors: string[];
}

export interface EcosystemCoverage {
  recognised: Ecosystem[];
  /* Code in a recognised language whose manifest is missing, e.g. .py files with no pyproject.toml or requirements.txt. */
  languagesWithoutManifest: string[];
  /* Code in a language KoreLumina does not analyze yet. */
  unsupportedLanguages: string[];
}

export interface NodePackageInput {
  directory: string;
  manifest: string;
  name: string | null;
  version: string | null;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
  frameworks: { name: string }[];
  parseError: string | null;
}

export interface EcosystemInput {
  paths: readonly string[];
  read(file: string): string | null;
  nodePackages: readonly NodePackageInput[];
  nodeTool: string | null;
  nodeLockfiles: readonly string[];
  languages: readonly { language: string; files: number }[];
}

const LANGUAGE_ECOSYSTEM: Record<string, Ecosystem> = {
  TypeScript: "node",
  JavaScript: "node",
  Vue: "node",
  Svelte: "node",
  Astro: "node",
  Python: "python",
  Go: "go",
  Rust: "rust",
  Java: "jvm",
  Kotlin: "jvm",
  Scala: "jvm",
  Groovy: "jvm",
  "C#": "dotnet",
  "F#": "dotnet",
  "Visual Basic": "dotnet",
  PHP: "php",
  Ruby: "ruby",
  Swift: "swift",
  "Objective-C": "swift",
  Dart: "dart",
  C: "c-cpp",
  "C++": "c-cpp",
};

const NOT_CODE = new Set(["JSON", "Markdown", "MDX", "YAML", "TOML", "CSS", "SCSS", "Less", "HTML", "SQL", "Shell"]);

/* ---------- helpers ---------- */

const dir = (file: string) => path.posix.dirname(file);
const base = (file: string) => path.posix.basename(file);
const str = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

function depsFromTable(table: TomlValue | undefined, scope: DependencyScope, skip: readonly string[] = []): EcosystemDependency[] {
  if (!table || typeof table !== "object" || Array.isArray(table)) return [];
  return Object.entries(table as TomlTable)
    .filter(([name]) => !skip.includes(name.toLowerCase()))
    .map(([name, value]) => ({
      name,
      spec: typeof value === "string" ? value : str(tomlGet(value, "version")) ?? (tomlGet(value, "git") ? `git ${tomlGet(value, "git")}` : tomlGet(value, "path") ? `path ${tomlGet(value, "path")}` : null),
      scope,
    }));
}

/* PEP 508: "requests[socks]>=2.31; python_version >= '3.8'" */
function pep508(line: string, scope: DependencyScope): EcosystemDependency | null {
  const requirement = line.split(";")[0].trim();
  const match = requirement.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)(\[[^\]]*\])?\s*(.*)$/);
  if (!match) return null;
  return { name: match[1].toLowerCase().replace(/_/g, "-"), spec: match[3].trim().replace(/^\(|\)$/g, "") || null, scope };
}

function frameworksFrom(dependencies: readonly EcosystemDependency[], known: Record<string, string>): string[] {
  const found = new Set<string>();
  for (const dependency of dependencies) {
    const key = dependency.name.toLowerCase();
    for (const [prefix, label] of Object.entries(known)) {
      if (key === prefix || (prefix.endsWith("*") && key.startsWith(prefix.slice(0, -1)))) found.add(label);
    }
  }
  return [...found].sort();
}

/* ---------- Python ---------- */

function pythonPackage(directory: string, files: string[], input: EcosystemInput): EcosystemPackage {
  const result: EcosystemPackage = { ecosystem: "python", directory, manifests: files, name: null, version: null, tool: null, lockfiles: [], dependencies: [], frameworks: [], parseErrors: [] };
  const prefix = directory === "." ? "" : `${directory}/`;
  const has = (name: string) => input.paths.includes(`${prefix}${name}`);
  for (const file of files) {
    const text = input.read(file);
    if (text === null) {
      result.parseErrors.push(`${file}: unreadable`);
      continue;
    }
    const name = base(file);
    try {
      if (name === "pyproject.toml") {
        const toml = parseToml(text);
        result.name ??= str(tomlGet(toml, "project", "name")) ?? str(tomlGet(toml, "tool", "poetry", "name"));
        result.version ??= str(tomlGet(toml, "project", "version")) ?? str(tomlGet(toml, "tool", "poetry", "version"));
        const declared = tomlGet(toml, "project", "dependencies");
        if (Array.isArray(declared)) for (const entry of declared) if (typeof entry === "string") { const dep = pep508(entry, "runtime"); if (dep) result.dependencies.push(dep); }
        const optional = tomlGet(toml, "project", "optional-dependencies");
        if (optional && typeof optional === "object" && !Array.isArray(optional)) {
          for (const list of Object.values(optional)) if (Array.isArray(list)) for (const entry of list) if (typeof entry === "string") { const dep = pep508(entry, "optional"); if (dep) result.dependencies.push(dep); }
        }
        const groups = tomlGet(toml, "dependency-groups");
        if (groups && typeof groups === "object" && !Array.isArray(groups)) {
          for (const list of Object.values(groups)) if (Array.isArray(list)) for (const entry of list) if (typeof entry === "string") { const dep = pep508(entry, "development"); if (dep) result.dependencies.push(dep); }
        }
        result.dependencies.push(...depsFromTable(tomlGet(toml, "tool", "poetry", "dependencies"), "runtime", ["python"]));
        result.dependencies.push(...depsFromTable(tomlGet(toml, "tool", "poetry", "dev-dependencies"), "development"));
        const poetryGroups = tomlGet(toml, "tool", "poetry", "group");
        if (poetryGroups && typeof poetryGroups === "object" && !Array.isArray(poetryGroups)) {
          for (const group of Object.values(poetryGroups)) result.dependencies.push(...depsFromTable(tomlGet(group, "dependencies"), "development"));
        }
        if (tomlGet(toml, "tool", "poetry")) result.tool ??= "poetry";
        if (tomlGet(toml, "tool", "pdm")) result.tool ??= "pdm";
        if (tomlGet(toml, "tool", "uv")) result.tool ??= "uv";
        if (tomlGet(toml, "tool", "hatch")) result.tool ??= "hatch";
      } else if (name === "Pipfile") {
        const toml = parseToml(text);
        result.dependencies.push(...depsFromTable(toml.packages, "runtime"), ...depsFromTable(toml["dev-packages"], "development"));
        result.tool ??= "pipenv";
      } else if (name === "setup.cfg") {
        const metadata = text.match(/^\[metadata\]([\s\S]*?)(^\[|$(?![\s\S]))/m)?.[1] ?? "";
        result.name ??= metadata.match(/^name\s*=\s*(.+)$/m)?.[1].trim() ?? null;
        result.version ??= metadata.match(/^version\s*=\s*(.+)$/m)?.[1].trim() ?? null;
        const requires = text.match(/^install_requires\s*=\s*\n((?:[ \t]+.+\n?)+)/m)?.[1] ?? "";
        for (const line of requires.split("\n")) { const dep = pep508(line.trim(), "runtime"); if (dep) result.dependencies.push(dep); }
      } else if (name === "setup.py") {
        result.name ??= text.match(/\bname\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
        result.version ??= text.match(/\bversion\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
        const requires = text.match(/install_requires\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? "";
        for (const entry of requires.matchAll(/["']([^"']+)["']/g)) { const dep = pep508(entry[1], "runtime"); if (dep) result.dependencies.push(dep); }
      } else {
        const scope: DependencyScope = /dev|test|lint|doc/i.test(file) ? "development" : "runtime";
        for (const raw of text.split(/\r?\n/)) {
          const line = raw.replace(/\s+#.*$/, "").trim();
          if (!line || line.startsWith("#") || line.startsWith("-")) continue;
          const dep = pep508(line, scope);
          if (dep) result.dependencies.push(dep);
        }
      }
    } catch (error) {
      result.parseErrors.push(`${file}: ${(error as Error).message}`);
    }
  }
  for (const [lock, tool] of [["poetry.lock", "poetry"], ["uv.lock", "uv"], ["pdm.lock", "pdm"], ["Pipfile.lock", "pipenv"]] as const) {
    if (has(lock)) {
      result.lockfiles.push(`${prefix}${lock}`);
      result.tool ??= tool;
    }
  }
  result.tool ??= "pip";
  result.frameworks = frameworksFrom(result.dependencies, { django: "Django", flask: "Flask", fastapi: "FastAPI", starlette: "Starlette", pyramid: "Pyramid", tornado: "Tornado", streamlit: "Streamlit" });
  return result;
}

/* ---------- Go ---------- */

function goPackage(file: string, text: string, input: EcosystemInput): EcosystemPackage {
  const directory = dir(file);
  const dependencies: EcosystemDependency[] = [];
  const add = (line: string) => {
    const match = line.trim().match(/^(\S+)\s+(\S+)(\s*\/\/\s*indirect)?/);
    if (match && !match[1].startsWith("//")) dependencies.push({ name: match[1], spec: match[2], scope: match[3] ? "indirect" : "runtime" });
  };
  for (const block of text.matchAll(/^require\s*\(([\s\S]*?)^\)/gm)) for (const line of block[1].split("\n")) add(line);
  for (const single of text.matchAll(/^require\s+([^(\s].*)$/gm)) add(single[1]);
  const prefix = directory === "." ? "" : `${directory}/`;
  return {
    ecosystem: "go",
    directory,
    manifests: [file],
    name: text.match(/^module\s+(\S+)/m)?.[1] ?? null,
    version: text.match(/^go\s+(\S+)/m)?.[1] ?? null,
    tool: "go",
    lockfiles: input.paths.includes(`${prefix}go.sum`) ? [`${prefix}go.sum`] : [],
    dependencies,
    frameworks: frameworksFrom(dependencies, { "github.com/gin-gonic/gin": "Gin", "github.com/labstack/echo*": "Echo", "github.com/gofiber/fiber*": "Fiber", "github.com/go-chi/chi*": "chi", "google.golang.org/grpc": "gRPC" }),
    parseErrors: [],
  };
}

/* ---------- Rust ---------- */

function rustPackage(file: string, text: string, input: EcosystemInput): EcosystemPackage {
  const directory = dir(file);
  const toml = parseToml(text);
  const dependencies = [
    ...depsFromTable(toml.dependencies, "runtime"),
    ...depsFromTable(toml["dev-dependencies"], "development"),
    ...depsFromTable(toml["build-dependencies"], "build"),
    ...depsFromTable(tomlGet(toml, "workspace", "dependencies"), "runtime"),
  ];
  const lock = [directory === "." ? "Cargo.lock" : `${directory}/Cargo.lock`, "Cargo.lock"].find((candidate) => input.paths.includes(candidate));
  return {
    ecosystem: "rust",
    directory,
    manifests: [file],
    name: str(tomlGet(toml, "package", "name")),
    version: str(tomlGet(toml, "package", "version")),
    tool: "cargo",
    lockfiles: lock ? [lock] : [],
    dependencies,
    frameworks: frameworksFrom(dependencies, { "actix-web": "Actix Web", axum: "Axum", rocket: "Rocket", tauri: "Tauri", bevy: "Bevy", leptos: "Leptos", warp: "Warp" }),
    parseErrors: [],
  };
}

/* ---------- Java and Kotlin ---------- */

const JVM_FRAMEWORKS = { "org.springframework.boot:*": "Spring Boot", "io.quarkus:*": "Quarkus", "io.micronaut:*": "Micronaut", "io.ktor:*": "Ktor", "io.dropwizard:*": "Dropwizard" };

function mavenPackage(file: string, text: string): EcosystemPackage {
  const xml = withoutXmlComments(text);
  const own = xml.replace(/<parent>[\s\S]*?<\/parent>/g, "").replace(/<dependencyManagement>[\s\S]*?<\/dependencyManagement>/g, "").replace(/<build>[\s\S]*?<\/build>/g, "").replace(/<profiles>[\s\S]*?<\/profiles>/g, "");
  const header = own.replace(/<dependencies>[\s\S]*?<\/dependencies>/g, "");
  const dependencies: EcosystemDependency[] = [];
  for (const block of xmlBlocks(own, "dependencies")) {
    for (const dependency of xmlBlocks(block, "dependency")) {
      const group = xmlText(dependency, "groupId");
      const artifact = xmlText(dependency, "artifactId");
      if (!artifact) continue;
      const scopeText = xmlText(dependency, "scope");
      const scope: DependencyScope = xmlText(dependency, "optional") === "true" ? "optional" : scopeText === "test" ? "development" : scopeText === "provided" ? "build" : "runtime";
      dependencies.push({ name: group ? `${group}:${artifact}` : artifact, spec: xmlText(dependency, "version"), scope });
    }
  }
  const parentGroup = xmlText(xml.match(/<parent>([\s\S]*?)<\/parent>/)?.[1] ?? "", "groupId");
  const group = xmlText(header, "groupId") ?? parentGroup;
  const artifact = xmlText(header, "artifactId");
  const plugins = xml.match(/<build>[\s\S]*?<\/build>/)?.[0] ?? "";
  const parent = xml.match(/<parent>[\s\S]*?<\/parent>/)?.[0] ?? "";
  const frameworks = new Set(frameworksFrom(dependencies, JVM_FRAMEWORKS));
  if (/spring-boot/.test(parent) || /spring-boot-maven-plugin/.test(plugins)) frameworks.add("Spring Boot");
  return {
    ecosystem: "jvm",
    directory: dir(file),
    manifests: [file],
    name: artifact ? (group ? `${group}:${artifact}` : artifact) : null,
    version: xmlText(header, "version"),
    tool: "maven",
    lockfiles: [],
    dependencies,
    frameworks: [...frameworks].sort(),
    parseErrors: [],
  };
}

const GRADLE_CONFIGURATIONS: Record<string, DependencyScope> = {
  implementation: "runtime",
  api: "runtime",
  runtimeOnly: "runtime",
  compile: "runtime",
  compileOnly: "build",
  annotationProcessor: "build",
  kapt: "build",
  ksp: "build",
  classpath: "build",
  testImplementation: "development",
  testRuntimeOnly: "development",
  testCompileOnly: "development",
  androidTestImplementation: "development",
  debugImplementation: "development",
};

function gradlePackage(directory: string, files: string[], input: EcosystemInput): EcosystemPackage {
  const dependencies: EcosystemDependency[] = [];
  const frameworks = new Set<string>();
  let name: string | null = null;
  let version: string | null = null;
  const parseErrors: string[] = [];
  for (const file of files) {
    const text = input.read(file);
    if (text === null) {
      parseErrors.push(`${file}: unreadable`);
      continue;
    }
    if (/settings\.gradle(\.kts)?$/.test(file)) {
      name ??= text.match(/rootProject\.name\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
      continue;
    }
    const pattern = new RegExp(`\\b(${Object.keys(GRADLE_CONFIGURATIONS).join("|")})\\s*\\(?\\s*["']([^"':\\s]+):([^"':\\s]+)(?::([^"'\\s]+))?["']`, "g");
    for (const match of text.matchAll(pattern)) {
      dependencies.push({ name: `${match[2]}:${match[3]}`, spec: match[4] ?? null, scope: GRADLE_CONFIGURATIONS[match[1]] });
    }
    version ??= text.match(/^\s*version\s*=\s*["']([^"']+)["']/m)?.[1] ?? null;
    if (/com\.android\.(application|library)/.test(text)) frameworks.add("Android");
    if (/org\.springframework\.boot/.test(text)) frameworks.add("Spring Boot");
    if (/io\.ktor/.test(text)) frameworks.add("Ktor");
    if (/org\.jetbrains\.compose|androidx\.compose/.test(text)) frameworks.add("Jetpack Compose");
  }
  for (const framework of frameworksFrom(dependencies, JVM_FRAMEWORKS)) frameworks.add(framework);
  const prefix = directory === "." ? "" : `${directory}/`;
  return {
    ecosystem: "jvm",
    directory,
    manifests: files,
    name: name ?? (directory === "." ? null : base(directory)),
    version,
    tool: "gradle",
    lockfiles: input.paths.includes(`${prefix}gradle.lockfile`) ? [`${prefix}gradle.lockfile`] : [],
    dependencies,
    frameworks: [...frameworks].sort(),
    parseErrors,
  };
}

/* ---------- .NET ---------- */

function dotnetPackage(file: string, text: string, input: EcosystemInput): EcosystemPackage {
  const xml = withoutXmlComments(text);
  const dependencies: EcosystemDependency[] = [];
  if (base(file) === "packages.config") {
    for (const element of xml.matchAll(/<package\s[^>]*>/g)) {
      const id = xmlAttribute(element[0], "id");
      if (id) dependencies.push({ name: id, spec: xmlAttribute(element[0], "version"), scope: xmlAttribute(element[0], "developmentDependency") === "true" ? "development" : "runtime" });
    }
  }
  for (const element of xml.matchAll(/<PackageReference\s([^>]*?)(\/>|>([\s\S]*?)<\/PackageReference>)/g)) {
    const include = xmlAttribute(element[1], "Include") ?? xmlAttribute(element[1], "Update");
    if (!include) continue;
    const privateAssets = xmlAttribute(element[1], "PrivateAssets") ?? xmlText(element[3] ?? "", "PrivateAssets");
    dependencies.push({ name: include, spec: xmlAttribute(element[1], "Version") ?? xmlText(element[3] ?? "", "Version"), scope: privateAssets === "all" ? "build" : "runtime" });
  }
  const sdk = xml.match(/<Project\s[^>]*Sdk\s*=\s*"([^"]+)"/)?.[1] ?? "";
  const frameworks = new Set<string>();
  if (/Microsoft\.NET\.Sdk\.Web/.test(sdk) || dependencies.some((dependency) => dependency.name.startsWith("Microsoft.AspNetCore"))) frameworks.add("ASP.NET Core");
  if (/BlazorWebAssembly/.test(sdk) || dependencies.some((dependency) => /Blazor/.test(dependency.name))) frameworks.add("Blazor");
  if (/<UseMaui>\s*true/i.test(xml)) frameworks.add(".NET MAUI");
  if (/Microsoft\.NET\.Sdk\.Worker/.test(sdk)) frameworks.add("Worker Service");
  const directory = dir(file);
  const prefix = directory === "." ? "" : `${directory}/`;
  return {
    ecosystem: "dotnet",
    directory,
    manifests: [file],
    name: base(file) === "packages.config" ? null : base(file).replace(/\.(cs|fs|vb)proj$/, ""),
    version: xmlText(xml, "Version") ?? xmlText(xml, "TargetFramework") ?? xmlText(xml, "TargetFrameworks"),
    tool: "dotnet",
    lockfiles: input.paths.includes(`${prefix}packages.lock.json`) ? [`${prefix}packages.lock.json`] : [],
    dependencies,
    frameworks: [...frameworks].sort(),
    parseErrors: [],
  };
}

/* ---------- PHP ---------- */

function phpPackage(file: string, text: string, input: EcosystemInput): EcosystemPackage {
  const directory = dir(file);
  const prefix = directory === "." ? "" : `${directory}/`;
  const json = JSON.parse(text) as Record<string, unknown>;
  const table = (value: unknown, scope: DependencyScope) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.entries(value as Record<string, unknown>)
          .filter(([name]) => name !== "php" && !name.startsWith("ext-") && !name.startsWith("lib-"))
          .map(([name, spec]) => ({ name, spec: typeof spec === "string" ? spec : null, scope }))
      : [];
  const dependencies = [...table(json.require, "runtime"), ...table(json["require-dev"], "development")];
  return {
    ecosystem: "php",
    directory,
    manifests: [file],
    name: str(json.name),
    version: str(json.version),
    tool: "composer",
    lockfiles: input.paths.includes(`${prefix}composer.lock`) ? [`${prefix}composer.lock`] : [],
    dependencies,
    frameworks: frameworksFrom(dependencies, { "laravel/framework": "Laravel", "symfony/framework-bundle": "Symfony", "slim/slim": "Slim", "cakephp/cakephp": "CakePHP", "yiisoft/yii2": "Yii", "laminas/*": "Laminas" }),
    parseErrors: [],
  };
}

/* ---------- Ruby ---------- */

function rubyPackage(directory: string, files: string[], input: EcosystemInput): EcosystemPackage {
  const dependencies: EcosystemDependency[] = [];
  let name: string | null = null;
  let version: string | null = null;
  const parseErrors: string[] = [];
  for (const file of files) {
    const text = input.read(file);
    if (text === null) {
      parseErrors.push(`${file}: unreadable`);
      continue;
    }
    if (file.endsWith(".gemspec")) {
      name ??= text.match(/\.name\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
      version ??= text.match(/\.version\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
      for (const match of text.matchAll(/\.add_(development_|runtime_)?dependency\s*\(?\s*["']([^"']+)["']\s*(?:,\s*["']([^"']+)["'])?/g)) {
        dependencies.push({ name: match[2], spec: match[3] ?? null, scope: match[1] === "development_" ? "development" : "runtime" });
      }
      continue;
    }
    let group: DependencyScope = "runtime";
    let depth = 0;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/#.*$/, "").trim();
      if (/^group\b.*\bdo$/.test(line)) {
        group = /:(development|test)\b/.test(line) ? "development" : "runtime";
        depth += 1;
        continue;
      }
      if (line === "end" && depth > 0) {
        depth -= 1;
        if (depth === 0) group = "runtime";
        continue;
      }
      const gem = line.match(/^gem\s+["']([^"']+)["']\s*(?:,\s*["']([^"']+)["'])?/);
      if (gem) dependencies.push({ name: gem[1], spec: gem[2] ?? null, scope: /group:\s*\[?\s*:(development|test)/.test(line) ? "development" : group });
    }
  }
  const prefix = directory === "." ? "" : `${directory}/`;
  return {
    ecosystem: "ruby",
    directory,
    manifests: files,
    name,
    version,
    tool: "bundler",
    lockfiles: input.paths.includes(`${prefix}Gemfile.lock`) ? [`${prefix}Gemfile.lock`] : [],
    dependencies,
    frameworks: frameworksFrom(dependencies, { rails: "Ruby on Rails", sinatra: "Sinatra", hanami: "Hanami", roda: "Roda" }),
    parseErrors,
  };
}

/* ---------- Swift ---------- */

function swiftPackage(directory: string, files: string[], input: EcosystemInput): EcosystemPackage {
  const dependencies: EcosystemDependency[] = [];
  const lockfiles: string[] = [];
  const tools = new Set<string>();
  let name: string | null = null;
  let xcodeName: string | null = null;
  const parseErrors: string[] = [];
  const prefix = directory === "." ? "" : `${directory}/`;
  const urlName = (url: string) => base(url.replace(/\.git$/, "").replace(/\/+$/, ""));
  for (const file of files) {
    const text = input.read(file);
    if (text === null) {
      parseErrors.push(`${file}: unreadable`);
      continue;
    }
    if (base(file) === "Package.swift") {
      tools.add("swiftpm");
      name ??= text.match(/Package\s*\(\s*name:\s*"([^"]+)"/)?.[1] ?? null;
      for (const match of text.matchAll(/\.package\s*\(\s*(?:name:\s*"[^"]+"\s*,\s*)?url:\s*"([^"]+)"\s*,\s*([^)]*)\)/g)) {
        const spec = match[2].match(/"([^"]+)"/)?.[1] ?? null;
        dependencies.push({ name: urlName(match[1]), spec, scope: "runtime" });
      }
      if (input.paths.includes(`${prefix}Package.resolved`)) lockfiles.push(`${prefix}Package.resolved`);
    } else if (base(file) === "Podfile") {
      tools.add("cocoapods");
      for (const match of text.matchAll(/^\s*pod\s+["']([^"']+)["']\s*(?:,\s*["']([^"']+)["'])?/gm)) dependencies.push({ name: match[1], spec: match[2] ?? null, scope: "runtime" });
      if (input.paths.includes(`${prefix}Podfile.lock`)) lockfiles.push(`${prefix}Podfile.lock`);
    } else if (file.endsWith("project.pbxproj")) {
      tools.add("xcode");
      xcodeName ??= base(dir(file)).replace(/\.xcodeproj$/, "");
      for (const match of text.matchAll(/repositoryURL\s*=\s*"([^"]+)"/g)) dependencies.push({ name: urlName(match[1]), spec: null, scope: "runtime" });
    }
  }
  return {
    ecosystem: "swift",
    directory,
    manifests: files,
    name: name ?? xcodeName,
    version: null,
    tool: [...tools].sort().join("+") || null,
    lockfiles,
    dependencies,
    frameworks: frameworksFrom(dependencies, { vapor: "Vapor", hummingbird: "Hummingbird" }),
    parseErrors,
  };
}

/* ---------- Dart and Flutter ---------- */

function dartPackage(file: string, text: string, input: EcosystemInput): EcosystemPackage {
  const yaml = parseSimpleYaml(text);
  const table = (value: YamlMap[string] | undefined, scope: DependencyScope): EcosystemDependency[] =>
    value && typeof value === "object"
      ? Object.entries(value)
          .filter(([, spec]) => !(spec && typeof spec === "object" && "sdk" in spec))
          .map(([name, spec]) => ({ name, spec: typeof spec === "string" ? spec : spec && typeof spec === "object" ? (typeof spec.version === "string" ? spec.version : typeof spec.git === "string" ? `git ${spec.git}` : spec.path ? `path ${spec.path}` : null) : null, scope }))
      : [];
  const dependencies = [...table(yaml.dependencies, "runtime"), ...table(yaml.dev_dependencies, "development")];
  const flutter = Boolean(yaml.flutter) || (typeof yaml.dependencies === "object" && yaml.dependencies !== null && "flutter" in yaml.dependencies);
  const directory = dir(file);
  const prefix = directory === "." ? "" : `${directory}/`;
  return {
    ecosystem: "dart",
    directory,
    manifests: [file],
    name: typeof yaml.name === "string" ? yaml.name : null,
    version: typeof yaml.version === "string" ? yaml.version : null,
    tool: flutter ? "flutter" : "dart",
    lockfiles: input.paths.includes(`${prefix}pubspec.lock`) ? [`${prefix}pubspec.lock`] : [],
    dependencies,
    frameworks: flutter ? ["Flutter"] : [],
    parseErrors: [],
  };
}

/* ---------- C and C++ ---------- */

function cPackage(directory: string, files: string[], input: EcosystemInput): EcosystemPackage {
  const dependencies: EcosystemDependency[] = [];
  const tools = new Set<string>();
  let name: string | null = null;
  let version: string | null = null;
  const parseErrors: string[] = [];
  for (const file of files) {
    const text = input.read(file);
    if (text === null) {
      parseErrors.push(`${file}: unreadable`);
      continue;
    }
    const fileName = base(file);
    if (fileName === "CMakeLists.txt") {
      tools.add("cmake");
      const project = text.match(/^\s*project\s*\(\s*([A-Za-z0-9_.+-]+)([^)]*)\)/im);
      if (project) {
        name ??= project[1];
        version ??= project[2].match(/VERSION\s+([0-9][0-9.]*)/i)?.[1] ?? null;
      }
      for (const match of text.matchAll(/^\s*find_package\s*\(\s*([A-Za-z0-9_.+-]+)\s*([0-9][0-9.]*)?/gim)) dependencies.push({ name: match[1], spec: match[2] ?? null, scope: "build" });
      for (const match of text.matchAll(/FetchContent_Declare\s*\(\s*([A-Za-z0-9_.+-]+)[\s\S]*?(?:GIT_TAG\s+(\S+))?[\s\S]*?\)/gi)) dependencies.push({ name: match[1], spec: match[2] ?? null, scope: "build" });
    } else if (fileName === "meson.build") {
      tools.add("meson");
      const project = text.match(/project\s*\(\s*'([^']+)'[\s\S]*?(?:version\s*:\s*'([^']+)')?/);
      if (project) {
        name ??= project[1];
        version ??= project[2] ?? null;
      }
      for (const match of text.matchAll(/dependency\s*\(\s*'([^']+)'/g)) dependencies.push({ name: match[1], spec: null, scope: "build" });
    } else if (fileName === "vcpkg.json") {
      tools.add("vcpkg");
      const json = JSON.parse(text) as Record<string, unknown>;
      name ??= str(json.name);
      version ??= str(json.version) ?? str(json["version-string"]) ?? str(json["version-semver"]);
      for (const entry of Array.isArray(json.dependencies) ? json.dependencies : []) {
        const dependencyName = typeof entry === "string" ? entry : str((entry as Record<string, unknown>)?.name);
        if (dependencyName) dependencies.push({ name: dependencyName, spec: typeof entry === "object" ? str((entry as Record<string, unknown>)["version>="]) : null, scope: "runtime" });
      }
    } else if (fileName === "conanfile.txt") {
      tools.add("conan");
      const requires = text.match(/^\[requires\]([\s\S]*?)(^\[|$(?![\s\S]))/m)?.[1] ?? "";
      for (const line of requires.split("\n").map((entry) => entry.trim()).filter(Boolean)) {
        const [dependencyName, spec] = line.split("/");
        dependencies.push({ name: dependencyName, spec: spec ?? null, scope: "runtime" });
      }
    } else if (fileName === "Makefile") {
      tools.add("make");
    }
  }
  return {
    ecosystem: "c-cpp",
    directory,
    manifests: files,
    name,
    version,
    tool: [...tools].sort().join("+") || null,
    lockfiles: [],
    dependencies,
    frameworks: frameworksFrom(dependencies, { qt5: "Qt", qt6: "Qt", boost: "Boost", sdl2: "SDL" }),
    parseErrors,
  };
}

/* ---------- detection ---------- */

const PYTHON_MANIFEST = /(^|\/)(pyproject\.toml|Pipfile|setup\.py|setup\.cfg|requirements[\w.-]*\.txt|requirements\/[\w.-]+\.txt)$/;
const GRADLE_MANIFEST = /(^|\/)(build|settings)\.gradle(\.kts)?$/;
const DOTNET_MANIFEST = /(^|\/)([^/]+\.(cs|fs|vb)proj|packages\.config)$/;
const RUBY_MANIFEST = /(^|\/)(Gemfile|[^/]+\.gemspec)$/;
const SWIFT_MANIFEST = /(^|\/)(Package\.swift|Podfile|[^/]+\.xcodeproj\/project\.pbxproj)$/;
const C_MANIFEST = /(^|\/)(CMakeLists\.txt|meson\.build|vcpkg\.json|conanfile\.txt|Makefile)$/;
const C_SOURCE = /\.(c|cc|cpp|cxx|h|hh|hpp|hxx)$/i;

function groupBy(files: readonly string[], test: RegExp, owner: (file: string) => string = dir): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const file of files) {
    if (!test.test(file)) continue;
    const key = owner(file);
    groups.set(key, [...(groups.get(key) ?? []), file]);
  }
  return groups;
}

function single(file: string, input: EcosystemInput, build: (text: string) => EcosystemPackage, ecosystem: Ecosystem): EcosystemPackage {
  const text = input.read(file);
  const empty: EcosystemPackage = { ecosystem, directory: dir(file), manifests: [file], name: null, version: null, tool: null, lockfiles: [], dependencies: [], frameworks: [], parseErrors: [] };
  if (text === null) return { ...empty, parseErrors: [`${file}: unreadable`] };
  try {
    return build(text);
  } catch (error) {
    return { ...empty, parseErrors: [`${file}: ${(error as Error).message}`] };
  }
}

const SCOPE_ORDER: Record<DependencyScope, number> = { runtime: 0, optional: 1, build: 2, development: 3, indirect: 4 };

function tidy(entry: EcosystemPackage): EcosystemPackage {
  const seen = new Map<string, EcosystemDependency>();
  for (const dependency of entry.dependencies) {
    const key = `${dependency.scope}\u0000${dependency.name}`;
    if (!seen.has(key)) seen.set(key, dependency);
  }
  return {
    ...entry,
    manifests: [...entry.manifests].sort(),
    dependencies: [...seen.values()].sort((left, right) => SCOPE_ORDER[left.scope] - SCOPE_ORDER[right.scope] || (left.name < right.name ? -1 : left.name > right.name ? 1 : 0)),
  };
}

export function detectEcosystems(input: EcosystemInput): { packages: EcosystemPackage[]; coverage: EcosystemCoverage } {
  const paths = input.paths;
  const packages: EcosystemPackage[] = [];

  for (const node of input.nodePackages) {
    const record = (deps: Record<string, string>, scope: DependencyScope) => Object.entries(deps).map(([name, spec]) => ({ name, spec, scope }));
    packages.push({
      ecosystem: "node",
      directory: node.directory,
      manifests: [node.manifest],
      name: node.name,
      version: node.version,
      tool: input.nodeTool,
      lockfiles: node.directory === "." ? [...input.nodeLockfiles] : [],
      dependencies: [...record(node.dependencies, "runtime"), ...record(node.peerDependencies, "runtime"), ...record(node.optionalDependencies, "optional"), ...record(node.devDependencies, "development")],
      frameworks: node.frameworks.map((framework) => framework.name),
      parseErrors: node.parseError ? [`${node.manifest}: ${node.parseError}`] : [],
    });
  }

  for (const [directory, files] of groupBy(paths, PYTHON_MANIFEST, (file) => (file.includes("requirements/") ? dir(dir(file)) : dir(file)))) packages.push(pythonPackage(directory, files, input));
  for (const file of paths.filter((entry) => base(entry) === "go.mod")) packages.push(single(file, input, (text) => goPackage(file, text, input), "go"));
  for (const file of paths.filter((entry) => base(entry) === "Cargo.toml")) packages.push(single(file, input, (text) => rustPackage(file, text, input), "rust"));
  for (const file of paths.filter((entry) => base(entry) === "pom.xml")) packages.push(single(file, input, (text) => mavenPackage(file, text), "jvm"));
  for (const [directory, files] of groupBy(paths, GRADLE_MANIFEST)) packages.push(gradlePackage(directory, files, input));
  for (const file of paths.filter((entry) => DOTNET_MANIFEST.test(entry))) packages.push(single(file, input, (text) => dotnetPackage(file, text, input), "dotnet"));
  for (const file of paths.filter((entry) => base(entry) === "composer.json")) packages.push(single(file, input, (text) => phpPackage(file, text, input), "php"));
  for (const [directory, files] of groupBy(paths, RUBY_MANIFEST)) packages.push(rubyPackage(directory, files, input));
  for (const [directory, files] of groupBy(paths, SWIFT_MANIFEST, (file) => (file.endsWith("project.pbxproj") ? dir(dir(file)) : dir(file)))) packages.push(swiftPackage(directory, files, input));
  for (const file of paths.filter((entry) => base(entry) === "pubspec.yaml")) packages.push(single(file, input, (text) => dartPackage(file, text, input), "dart"));

  /* CMake trees nest; a Makefile alone counts only where C or C++ sources live beside or under it. */
  const cGroups = groupBy(paths, C_MANIFEST);
  for (const [directory, files] of cGroups) {
    const nestedCmake = files.some((file) => base(file) === "CMakeLists.txt") && [...cGroups.keys()].some((other) => other !== directory && (other === "." || directory.startsWith(`${other}/`)) && cGroups.get(other)!.some((file) => base(file) === "CMakeLists.txt"));
    const onlyMake = files.every((file) => base(file) === "Makefile");
    const prefix = directory === "." ? "" : `${directory}/`;
    if (onlyMake && !paths.some((file) => file.startsWith(prefix) && C_SOURCE.test(file))) continue;
    if (nestedCmake && files.every((file) => base(file) === "CMakeLists.txt")) continue;
    packages.push(cPackage(directory, files, input));
  }

  const tidied = packages.map(tidy).sort((left, right) => (left.ecosystem < right.ecosystem ? -1 : left.ecosystem > right.ecosystem ? 1 : left.directory === right.directory ? 0 : left.directory === "." ? -1 : right.directory === "." ? 1 : left.directory < right.directory ? -1 : 1));
  const recognised = [...new Set(tidied.map((entry) => entry.ecosystem))].sort();
  const code = input.languages.filter((share) => share.files > 0 && !NOT_CODE.has(share.language));
  return {
    packages: tidied,
    coverage: {
      recognised,
      languagesWithoutManifest: code.filter((share) => LANGUAGE_ECOSYSTEM[share.language] && !recognised.includes(LANGUAGE_ECOSYSTEM[share.language])).map((share) => share.language).sort(),
      unsupportedLanguages: code.filter((share) => !LANGUAGE_ECOSYSTEM[share.language]).map((share) => share.language).sort(),
    },
  };
}
