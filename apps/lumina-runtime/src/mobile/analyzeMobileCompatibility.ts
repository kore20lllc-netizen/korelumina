import { createHash } from "node:crypto";
import path from "node:path";
import type { RepositorySnapshot, SnapshotFile } from "../repository-intelligence/RepositorySnapshot.js";
import { ENVIRONMENT_FILE, MAX_FILES, MAX_TEXT_BYTES } from "../repository-intelligence/RepositorySnapshot.js";
import {
  MOBILE_COMPATIBILITY_VERSION, MobileCompatibilityInputError,
  type MobileApplicationCompatibility, type MobileCompatibilityOptions, type MobileCompatibilityReport,
  type MobileEvidence, type MobileFinding, type MobileFramework, type MobileTarget,
} from "./MobileCompatibility.js";

const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const join = (root: string, file: string) => root === "." ? file : `${root}/${file}`;
const directory = (file: string) => path.posix.dirname(file);
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const finding = (code: string, file: string, recommendation: string): MobileFinding => ({ code, path: file, recommendation });
function safePath(value: unknown, root = false): value is string {
  if (root && value === ".") return true;
  return typeof value === "string" && value.length > 0 && value.length <= 4096
    && !/[\\\x00-\x1f\x7f:%]/.test(value) && !path.posix.isAbsolute(value) && !path.win32.isAbsolute(value)
    && value.split("/").every(part => part.length > 0 && part !== "." && part !== "..");
}
function validate(snapshot: RepositorySnapshot): Map<string, SnapshotFile> {
  if (!object(snapshot) || typeof snapshot.root !== "string" || !path.isAbsolute(snapshot.root)
    || typeof snapshot.fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(snapshot.fingerprint)
    || !(snapshot.commit === null || (typeof snapshot.commit === "string" && /^[a-f0-9]{40,64}$/.test(snapshot.commit)))
    || !Array.isArray(snapshot.files) || snapshot.files.length > MAX_FILES
    || !Array.isArray(snapshot.skippedDirectories) || typeof snapshot.read !== "function" || typeof snapshot.readSensitive !== "function") {
    throw new MobileCompatibilityInputError("invalid_snapshot");
  }
  for (const skipped of snapshot.skippedDirectories) if (!safePath(skipped)) throw new MobileCompatibilityInputError("unsafe_path");
  const files = new Map<string, SnapshotFile>();
  const foldedPaths = new Set<string>();
  for (const file of snapshot.files) {
    if (!object(file) || !safePath(file.path)) throw new MobileCompatibilityInputError("unsafe_path");
    const filePath = file.path;
    if (snapshot.skippedDirectories.some(skipped => filePath.startsWith(`${skipped}/`))) throw new MobileCompatibilityInputError("invalid_snapshot", file.path);
    if (files.has(file.path)) throw new MobileCompatibilityInputError("duplicate_path", file.path);
    if (typeof file.bytes !== "number" || !Number.isSafeInteger(file.bytes) || file.bytes < 0 || typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256)
      || typeof file.text !== "boolean" || typeof file.ignored !== "boolean" || !(file.tracked === null || typeof file.tracked === "boolean")) {
      throw new MobileCompatibilityInputError("invalid_snapshot", file.path);
    }
    // Reject file/directory collisions, including case aliases across target OSes.
    if (foldedPaths.has(file.path.toLowerCase())) throw new MobileCompatibilityInputError("duplicate_path", file.path);
    files.set(file.path, { path: file.path, bytes: file.bytes, sha256: file.sha256, text: file.text, ignored: file.ignored, tracked: file.tracked });
    foldedPaths.add(file.path.toLowerCase());
  }
  const directories = new Map<string, string>();
  for (const file of files.keys()) {
    let parent = directory(file);
    while (parent !== ".") {
      const alias = directories.get(parent.toLowerCase());
      if (alias !== undefined && alias !== parent) throw new MobileCompatibilityInputError("duplicate_path", parent);
      directories.set(parent.toLowerCase(), parent);
      if (foldedPaths.has(parent.toLowerCase())) throw new MobileCompatibilityInputError("duplicate_path", parent);
      parent = directory(parent);
    }
  }
  if (hash(snapshot.files.filter(file => !file.ignored).map(file => `${file.path}\0${file.sha256}`).join("\n")) !== snapshot.fingerprint) {
    throw new MobileCompatibilityInputError("evidence_mismatch");
  }
  return new Map([...files].filter(([, file]) => !file.ignored).sort(([a], [b]) => compare(a, b)));
}

/** No filesystem, process, network, config evaluation, or sensitive-file reads. */
export function analyzeMobileCompatibility(snapshot: RepositorySnapshot, options: MobileCompatibilityOptions = {}): MobileCompatibilityReport {
  const files = validate(snapshot);
  if (!object(options)) throw new MobileCompatibilityInputError("invalid_snapshot");
  let readBytes = 0;
  if (options.applicationRoot !== undefined && !safePath(options.applicationRoot, true)) throw new MobileCompatibilityInputError("unsafe_path");
  const cache = new Map<string, string | null>();
  const read = (file: string): string | null => {
    const entry = files.get(file);
    if (!entry || ENVIRONMENT_FILE.test(path.posix.basename(file))) return null;
    if (cache.has(file)) return cache.get(file)!;
    if (!entry.text || entry.bytes > MAX_TEXT_BYTES || readBytes + entry.bytes > 8_000_000) throw new MobileCompatibilityInputError("unreadable_evidence", file);
    let text: string | null;
    try { text = snapshot.read(file); } catch { throw new MobileCompatibilityInputError("unreadable_evidence", file); }
    if (typeof text !== "string") throw new MobileCompatibilityInputError("unreadable_evidence", file);
    if (Buffer.byteLength(text) !== entry.bytes || hash(text) !== entry.sha256) throw new MobileCompatibilityInputError("evidence_mismatch", file);
    readBytes += entry.bytes;
    cache.set(file, text);
    return text;
  };
  const manifests = new Map<string, Record<string, unknown> | null>();
  for (const file of files.keys()) if (path.posix.basename(file) === "package.json") {
    const text = read(file);
    let value: unknown;
    try { value = JSON.parse(text!); } catch { value = null; }
    manifests.set(directory(file), object(value) ? value : null);
    if (manifests.size > 256) throw new MobileCompatibilityInputError("invalid_snapshot");
  }
  const roots = new Set(manifests.keys());
  const owner = (file: string): string | undefined => {
    let parent = directory(file);
    for (;;) {
      if (manifests.has(parent)) return parent;
      if (parent === ".") return undefined;
      parent = directory(parent);
    }
  };
  for (const file of files.keys()) {
    if (owner(file) !== undefined) continue;
    if (path.posix.basename(file) === "index.html") roots.add(directory(file));
    if (file.endsWith("/src/main/AndroidManifest.xml") || file === "src/main/AndroidManifest.xml") {
      const prefix = file.replace(/(?:app\/)?src\/main\/AndroidManifest\.xml$/, "").replace(/\/$/, "");
      roots.add(prefix || ".");
    }
    if (file.endsWith(".xcodeproj/project.pbxproj")) roots.add(directory(directory(file)));
  }
  if (roots.size > 256) throw new MobileCompatibilityInputError("invalid_snapshot");
  if (roots.size === 0) roots.add(".");
  const rootPackage = manifests.get(".");
  const monorepo = manifests.size > 1 || !!rootPackage?.workspaces || files.has("pnpm-workspace.yaml");
  const applications: MobileApplicationCompatibility[] = [];
  for (const root of [...roots].sort(compare)) {
    const manifest = join(root, "package.json");
    const pkg = manifests.get(root);
    const local = [...files.keys()].filter(file => (root === "." || file.startsWith(`${root}/`)) && (owner(file) === undefined || owner(file) === root));
    const relative = (file: string) => root === "." ? file : file.slice(root.length + 1);
    const evidence: MobileEvidence[] = [];
    const blockers: MobileFinding[] = [];
    const has = (file: string) => local.includes(join(root, file));
    const add = (file: string, code: string) => evidence.push({ path: file, code });
    const block = (code: string, file: string, advice: string) => blockers.push(finding(code, file, advice));
    const deps: Record<string, string> = {};
    let malformed = manifests.has(root) && pkg === null;
    for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
      const value = pkg?.[field];
      if (value === undefined) continue;
      if (!object(value) || Object.values(value).some(version => typeof version !== "string" || version.trim().length === 0)) malformed = true;
      else for (const [name, version] of Object.entries(value)) deps[name] = version as string;
    }
    const workspace = pkg?.workspaces;
    if (workspace !== undefined && !(Array.isArray(workspace) && workspace.every(value => typeof value === "string"))
      && !(object(workspace) && Array.isArray(workspace.packages) && workspace.packages.every(value => typeof value === "string"))) malformed = true;
    const scripts = pkg?.scripts;
    if (scripts !== undefined && (!object(scripts) || Object.values(scripts).some(value => typeof value !== "string"))) malformed = true;
    const buildScript = object(scripts) && typeof scripts.build === "string" && scripts.build.trim().length > 0;
    const nativeTargets: MobileTarget[] = [];
    const android = local.find(file => /(?:^|\/)src\/main\/AndroidManifest\.xml$/.test(relative(file)));
    const gradle = local.find(file => /(?:^|\/)(?:build|settings)\.gradle(?:\.kts)?$/.test(relative(file)));
    const ios = local.find(file => /\.xcodeproj\/project\.pbxproj$/.test(file));
    if (android && gradle) { nativeTargets.push("android"); add(android, "android-manifest"); add(gradle, "gradle-project"); }
    if (ios) { nativeTargets.push("ios"); add(ios, "xcode-project"); }
    let framework: MobileFramework = "unknown";
    let adapter: MobileApplicationCompatibility["adapter"] = null;
    let classification: MobileApplicationCompatibility["classification"] = "unknown";
    const declared = (name: string) => Object.prototype.hasOwnProperty.call(deps, name);
    const web = ["next", "nuxt", "@sveltejs/kit", "@angular/core", "react", "vue", "svelte", "vite"].filter(declared);
    const isContainer = !!pkg?.workspaces || (root === "." && files.has("pnpm-workspace.yaml"));
    const serverPackages = ["express", "fastify", "@nestjs/core", "koa", "hapi", "@hapi/hapi"].filter(declared);
    const backendDependencies = [...serverPackages, ...["@supabase/supabase-js", "firebase", "firebase-admin", "@prisma/client", "pg", "mongoose"].filter(declared)].sort(compare);
    if (pkg && (web.length || declared("expo") || declared("react-native") || buildScript || serverPackages.length)) add(manifest, "package-manifest");
    const choose = (value: MobileFramework, dependency: string): MobileFramework => { add(manifest, `dependency:${dependency}`); return value; };
    if (isContainer && !malformed && nativeTargets.length === 0 && !declared("next") && !declared("nuxt")
      && !local.some(file => /^(?:index\.html|src\/(?:main|index)\.[jt]sx?)$/.test(relative(file)))) continue;
    if (malformed) {
      block("malformed-manifest", manifest, "Supply a valid package.json object with string dependency versions and scripts.");
    } else if (declared("expo") || declared("react-native")) {
      framework = choose(declared("expo") ? "expo" : "react-native", declared("expo") ? "expo" : "react-native");
      adapter = framework === "expo" ? "expo" : "react-native"; classification = "requires-adaptation";
      block("native-adapter-required", manifest, "Use a dedicated Expo/React Native adapter; do not wrap or overwrite this application with Capacitor.");
    } else if (nativeTargets.length) {
      framework = "native"; adapter = "existing-native"; classification = "requires-adaptation";
      block("existing-native-project", root, "Preserve native projects and select a reviewed native build adapter; do not generate replacements.");
    } else if (declared("next") || declared("nuxt") || declared("@sveltejs/kit")) {
      const name = declared("next") ? "next" : declared("nuxt") ? "nuxt" : "@sveltejs/kit";
      framework = choose(name === "@sveltejs/kit" ? "sveltekit" : name as "next" | "nuxt", name);
      adapter = "capacitor"; classification = "requires-adaptation";
      block("static-export-unverified", manifest, "Verify a static-export adapter and isolate server routes, actions and backend services before packaging.");
    } else if (web.length) {
      const name = declared("@angular/core") ? "@angular/core" : declared("react") ? "react" : declared("vue") ? "vue" : declared("svelte") ? "svelte" : "vite";
      framework = choose(name === "@angular/core" ? "angular" : name as MobileFramework, name);
      adapter = "capacitor"; classification = "candidate";
      const conflicting = ["@angular/core", "react", "vue", "svelte"].filter(declared);
      if (conflicting.length > 1) {
        classification = "unknown";
        block("conflicting-frameworks", manifest, "Select a single application package or provide a reviewed framework adapter.");
      }
      const html = has("index.html") ? "index.html" : has("public/index.html") ? "public/index.html" : has("src/index.html") ? "src/index.html" : null;
      const entry = local.find(file => /^(?:src\/)?(?:main|index)\.(?:[cm]?[jt]sx?|vue|svelte)$/.test(relative(file)));
      if (html) {
        const text = read(join(root, html))!;
        add(join(root, html), "web-entry-html");
        if (!/<head(?:\s|>)/i.test(text)) block("html-head-missing", join(root, html), "Provide an HTML head element for native web asset injection.");
      } else block("web-entry-missing", root, "Identify the web entry and verify its emitted index.html in a later isolated build.");
      if (entry) add(entry, "application-entry");
      else { classification = "unknown"; block("application-entry-unverified", root, "Identify a framework application entry; a dependency alone does not establish an application."); }
      if (!buildScript) block("build-script-missing", manifest, "Declare and review the application build command; analysis never runs it.");
      if (framework === "angular" && has("angular.json")) {
        let config: unknown;
        const configText = read(join(root, "angular.json"));
        try { config = JSON.parse(configText!); } catch { config = null; }
        if (!object(config) || !object(config.projects)) {
          classification = "unknown"; block("angular-config-invalid", join(root, "angular.json"), "Supply a valid Angular workspace with explicit application projects.");
        } else if (Object.values(config.projects).filter(value => object(value) && value.projectType === "application").length !== 1) {
          classification = "unknown"; block("ambiguous-angular-target", join(root, "angular.json"), "Select a single Angular application target; multi-target Angular workspace expansion requires a dedicated adapter.");
        }
      }
      if (framework === "angular" && !has("angular.json")) block("angular-config-missing", root, "Supply the Angular workspace configuration and select its application target.");
      if (framework === "angular" && (declared("@angular/ssr") || declared("@angular/platform-server"))) block("server-rendering", manifest, "Separate SSR from exportable client assets.");
      if (blockers.length && classification !== "unknown") classification = "requires-adaptation";
    } else if (has("index.html")) {
      framework = "static-web"; adapter = "capacitor"; classification = "requires-adaptation";
      add(join(root, "index.html"), "static-web-entry");
      block("static-build-adapter-required", root, "Provide a package manifest and reviewed reproducible static-asset packaging adapter.");
    } else if (serverPackages.length || local.some(file => /^(?:pyproject\.toml|requirements\.txt|go\.mod|Cargo\.toml|pom\.xml)$/.test(relative(file)))) {
      framework = "backend"; classification = "unsupported";
      add(manifests.has(root) ? manifest : local[0] ?? root, "backend-project");
      block("backend-only", root, "Package a separate client application; backend services remain deployed services.");
    } else if (isContainer) {
      continue;
    } else {
      block("application-not-established", root, "Select an application root with verifiable framework and entry evidence.");
    }
    if (serverPackages.length && framework !== "backend") {
      block("co-located-server", manifest, "Separate server execution and secrets from the native client and document production backend endpoints.");
      if (classification === "candidate") classification = "requires-adaptation";
    }
    if (declared("firebase-admin") || declared("@prisma/client") || declared("pg") || declared("mongoose")) {
      block("server-dependency", manifest, "Move database/admin SDKs behind an authenticated backend; never embed server credentials in the app.");
      if (classification === "candidate") classification = "requires-adaptation";
    }
    for (const dependency of backendDependencies) add(manifest, `backend-dependency:${dependency}`);
    for (const file of local.filter(file => /(?:^|\/)(?:api|server)\/|\+page\.server\.|\+server\./.test(relative(file)))) {
      add(file, "server-source");
      if (!blockers.some(item => item.code === "server-source")) block("server-source", file, "Review server-side code and keep it outside the mobile bundle.");
      if (classification === "candidate") classification = "requires-adaptation";
    }
    for (const dependency of ["@remix-run/react", "@remix-run/node", "astro", "@astrojs/node", "@tanstack/react-start"].filter(declared)) {
      add(manifest, `server-framework:${dependency}`);
      block("server-framework-unverified", manifest, "Verify a static-export path for this server-capable framework; do not assume a Vite dependency establishes a client-only application.");
      if (classification === "candidate") classification = "requires-adaptation";
    }
    const capacitorConfig = local.find(file => /(?:^|\/)capacitor\.config\.(?:ts|js|json)$/.test(relative(file)));
    if (capacitorConfig && !nativeTargets.length) {
      add(capacitorConfig, "existing-capacitor-config");
      block("existing-capacitor-config", capacitorConfig, "Review and preserve existing native configuration before any generation or synchronization.");
      if (classification === "candidate") classification = "requires-adaptation";
    }
    const findings = [...new Map(blockers.map(item => [`${item.code}:${item.path}`, item])).values()].sort((a, b) => compare(`${a.code}:${a.path}`, `${b.code}:${b.path}`));
    applications.push({ root, framework, adapter, classification, nativeTargets, backendDependencies,
      evidence: evidence.sort((a, b) => compare(`${a.path}:${a.code}`, `${b.path}:${b.code}`)), blockers: findings,
      recommendations: [...new Set([...findings.map(item => item.recommendation),
        "Verify locked dependencies, native configuration, permissions, assets and toolchain in an isolated build; no build readiness has been certified.",
        ...(backendDependencies.length ? ["Validate native authentication, API origins and production backend connectivity without bundling secrets."] : []),
      ])].sort(compare),
      targets: (["android", "ios"] as const).map(target => {
        const missing = framework === "native" && !nativeTargets.includes(target);
        return { target, classification: missing ? "unsupported" : classification,
          blockers: missing ? [...findings, finding("native-target-missing", root, `No existing ${target} project was established; a reviewed native adaptation is required.`)] : [...findings] };
      }),
    });
  }
  const blockers: MobileFinding[] = [];
  let selectedApplicationRoot: string | null = null;
  if (options.applicationRoot !== undefined) {
    if (applications.some(app => app.root === options.applicationRoot)) selectedApplicationRoot = options.applicationRoot;
    else blockers.push(finding("application-root-not-found", options.applicationRoot, "Select one of the explicitly analyzed application roots."));
  } else if (applications.length === 1) selectedApplicationRoot = applications[0].root;
  else if (applications.length > 1) blockers.push(finding("ambiguous-application-root", ".", "Select one application root; do not package an entire monorepo implicitly."));
  else blockers.push(finding("application-not-established", ".", "Supply a snapshot containing an application, not only a workspace container."));
  const report = { version: MOBILE_COMPATIBILITY_VERSION, snapshotFingerprint: snapshot.fingerprint, monorepo,
    selectedApplicationRoot, selection: selectedApplicationRoot !== null ? "selected" as const : applications.length > 1 ? "ambiguous" as const : "none" as const,
    blockers, applications, buildVerification: "not-performed" as const };
  return { ...report, reportFingerprint: hash(JSON.stringify(report)) };
}
