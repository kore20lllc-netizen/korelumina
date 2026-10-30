import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import vm from "node:vm";
import { ANDROID_NATIVE_REPLAY_SCRIPT, ANDROID_GRADLE_LOCK_POLICY } from "../AndroidNativeDependencyReplay.js";
import { androidBuildScript } from "../AndroidPackagingExecutor.js";
const sha = (b: string | Buffer) => crypto.createHash("sha256").update(b).digest("hex");
// These tiny contract fixtures are NOT native dependency evidence or build artifacts.
const archiveFixture = Buffer.from("unit-only-gradle-archive-placeholder");
const officialGradleHash = "ed1a8d686605fd7c23bdf62c7fc7add1c5b23b2bbc3721e661934ef4a4911d7c";
function fixture() {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "replay-"));
  const mapped = (s: string) => s.startsWith("/opt/mobile") || s.startsWith("/work") || s.startsWith("/input") ? temporary + s : s;
  const write = (file: string, bytes: string | Buffer) => { fs.mkdirSync(path.dirname(mapped(file)), { recursive: true }); fs.writeFileSync(mapped(file), bytes); };
  const read = (file: string) => fs.readFileSync(mapped(file));
  const dependencies = { "@capacitor/cli": "8.0.0", "@capacitor/core": "8.0.0", "@capacitor/android": "8.0.0" };
  const pkg = { name: "korelumina-native-wrapper", version: "1.0.0", private: true, dependencies };
  const lock: any = { lockfileVersion: 3, packages: { "": { name: pkg.name, version: pkg.version, dependencies } } };
  for (const [name, version] of Object.entries(dependencies)) lock.packages["node_modules/" + name] = { version, resolved: "https://registry.npmjs.org/" + name + "/unit.tgz", integrity: "sha512-" + crypto.createHash("sha512").update(name).digest("base64") };
  const scope = { applicationIdentifier: "com.korelumina.certification", version: "1.0.0", buildNumber: 1, sourceSnapshotFingerprint: "a".repeat(64), specificationFingerprint: "b".repeat(64) };
  write("/input/plan.json", JSON.stringify(scope));
  write("/opt/mobile/locks/native-package.json", JSON.stringify(pkg));
  write("/opt/mobile/locks/native-package-lock.json", JSON.stringify(lock));
  write("/opt/mobile/locks/verification-metadata.xml", '<verification-metadata><configuration><verify-metadata>true</verify-metadata></configuration><components><sha256 value="' + sha("unit-maven") + '"/></components></verification-metadata>');
  write("/opt/mobile/cache/npm/content", "unit npm cache"); write("/opt/mobile/cache/gradle/content", "unit Gradle cache");
  write("/opt/mobile/archives/gradle-all.zip", archiveFixture);
  write("/opt/mobile/locks/gradle-locks/buildscript-gradle.lockfile", "unit:agp:8.13.0=classpath\n");
  write("/opt/mobile/locks/gradle-locks/app/gradle.lockfile", "unit:library:1.0.0=debugRuntimeClasspath\n");
  const controls: Record<string,string> = { "build.gradle": "classpath 'com.android.tools.build:gradle:8.13.0'", "app/build.gradle": "// unit generated application", "settings.gradle": "// unit settings", "variables.gradle": "// unit variables", "gradle/wrapper/gradle-wrapper.properties": "distributionUrl=https\\://services.gradle.org/distributions/gradle-8.14.3-all.zip\n", "gradle/wrapper/gradle-wrapper.jar": "unit wrapper bytes, not executable", "gradlew": "unit wrapper shell, never executed" };
  const replay: any = { schemaVersion: "android-native-replay:v1", capacitorVersion: "8.0.0", gradleVersion: "8.14.3", agpVersion: "8.13.0", closureComplete: true, scope, nativePackageLockSha256: sha(read("/opt/mobile/locks/native-package-lock.json")), verificationMetadataSha256: sha(read("/opt/mobile/locks/verification-metadata.xml")), generatedControls: Object.fromEntries(Object.entries(controls).map(([k,v])=>[k,sha(v)])), gradleLocks: { "buildscript-gradle.lockfile": sha(read("/opt/mobile/locks/gradle-locks/buildscript-gradle.lockfile")), "app/gradle.lockfile": sha(read("/opt/mobile/locks/gradle-locks/app/gradle.lockfile")) } };
  function refresh() {
    write("/opt/mobile/locks/native-replay.json", JSON.stringify(replay));
    const files: Record<string,string> = {};
    for(const relative of ["locks", "cache"]) {
      const walk=(dir:string)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else files[path.relative(mapped("/opt/mobile"),f)]=sha(fs.readFileSync(f));}};
      walk(mapped("/opt/mobile/"+relative));
    }
    write("/opt/mobile/integrity.json", JSON.stringify({ files, nativeClosureComplete: true, mavenStrictOfflineVerified: true }));
  }
  refresh(); fs.mkdirSync(mapped("/work/home"),{recursive:true});
  const virtualFs = new Proxy(fs, { get(target,key) {
    const fn = Reflect.get(target,key);
    if(typeof fn!=="function")return fn;
    return (...args:any[])=>{const result=Reflect.apply(fn,target,args.map(a=>typeof a==="string"?mapped(a):a));return key==="realpathSync" && typeof result==="string" && result.startsWith(temporary) ? result.slice(temporary.length) : result;};
  }});
  function run(phase="prepare") {
    // Only the isolated VM substitutes the distribution digest for tiny unit bytes.
    // Production always uses node:crypto and must verify the genuine archive.
    const unitCrypto = { createHash(algorithm:string) {
      const parts:Buffer[]=[];
      return { update(bytes:Buffer|string){parts.push(Buffer.from(bytes));return this;},digest(encoding:any){const bytes=Buffer.concat(parts);return algorithm==="sha256" && bytes.equals(archiveFixture) ? officialGradleHash : crypto.createHash(algorithm).update(bytes).digest(encoding);} };
    }};
    vm.runInNewContext(ANDROID_NATIVE_REPLAY_SCRIPT,{ require:(name:string)=> name==="node:fs"?virtualFs:name==="node:crypto"?unitCrypto:name==="node:path"?path:assert,process:{argv:["node","replay.cjs",phase,"8.0.0"]} },{timeout:3000});
  }
  function generated() { run(); for(const [name,bytes] of Object.entries(controls))write("/work/native/android/"+name,bytes); }
  return {temporary, mapped, write, read, lock, replay, controls, run, generated, refresh};
}
async function isolated(work:(f:ReturnType<typeof fixture>)=>void) { const f=fixture();try{work(f);}finally{fs.rmSync(f.temporary,{recursive:true,force:true});assert(!fs.existsSync(f.temporary));} }
test("reviewed native npm package and lock bytes are replayed exactly",()=>isolated(f=>{f.run();assert.deepEqual(f.read("/work/native/package-lock.json"),f.read("/opt/mobile/locks/native-package-lock.json"));}));
test("missing native lock fails closed",()=>isolated(f=>{fs.unlinkSync(f.mapped("/opt/mobile/locks/native-package-lock.json"));assert.throws(()=>f.run());}));
test("missing verification metadata fails before dependency replay",()=>isolated(f=>{fs.unlinkSync(f.mapped("/opt/mobile/locks/verification-metadata.xml"));assert.throws(()=>f.run());}));
test("unreviewed lock mutation is rejected",()=>isolated(f=>{f.write("/opt/mobile/locks/native-package-lock.json","{}");assert.throws(()=>f.run());}));
test("Capacitor version substitution is rejected even with refreshed file hashes",()=>isolated(f=>{f.lock.packages["node_modules/@capacitor/core"].version="9.0.0";f.write("/opt/mobile/locks/native-package-lock.json",JSON.stringify(f.lock));f.replay.nativePackageLockSha256=sha(f.read("/opt/mobile/locks/native-package-lock.json"));f.refresh();assert.throws(()=>f.run());}));
test("incomplete transitive npm closure is rejected",()=>isolated(f=>{f.lock.packages["node_modules/@capacitor/cli"].dependencies={missing:"1.0.0"};f.write("/opt/mobile/locks/native-package-lock.json",JSON.stringify(f.lock));f.replay.nativePackageLockSha256=sha(f.read("/opt/mobile/locks/native-package-lock.json"));f.refresh();assert.throws(()=>f.run());}));
test("incomplete offline closure declaration fails closed",()=>isolated(f=>{f.replay.closureComplete=false;f.refresh();assert.throws(()=>f.run());}));
test("unexpected seed-cache bytes are rejected",()=>isolated(f=>{f.write("/opt/mobile/cache/npm/unreviewed","bad");assert.throws(()=>f.run());}));
test("changed seed-cache bytes are rejected",()=>isolated(f=>{f.write("/opt/mobile/cache/gradle/content","changed");assert.throws(()=>f.run());}));
test("mutable web-build cache state is replaced by verified immutable seeds",()=>isolated(f=>{f.write("/work/home/.gradle/init.d/unsafe.gradle","must not execute");f.run();assert(!fs.existsSync(f.mapped("/work/home/.gradle/init.d/unsafe.gradle")));}));
test("generated wrapper receives exact locks, verification metadata and distribution pin",()=>isolated(f=>{f.generated();f.run("verify");assert.deepEqual(f.read("/work/native/android/gradle/verification-metadata.xml"),f.read("/opt/mobile/locks/verification-metadata.xml"));assert(f.read("/work/native/android/gradle/wrapper/gradle-wrapper.properties").toString().includes(officialGradleHash));assert.deepEqual(f.read("/work/native/android/app/gradle.lockfile"),f.read("/opt/mobile/locks/gradle-locks/app/gradle.lockfile"));}));
test("generated AGP/build-control substitution is rejected",()=>isolated(f=>{f.generated();f.write("/work/native/android/build.gradle","classpath 'unreviewed:plugin:1'");assert.throws(()=>f.run("verify"));}));
test("extra generated Gradle scripts are rejected",()=>isolated(f=>{f.generated();f.write("/work/native/android/extra.gradle","unreviewed");assert.throws(()=>f.run("verify"));}));
test("unexpected existing Gradle locks are rejected",()=>isolated(f=>{f.generated();f.write("/work/native/android/gradle.lockfile","unreviewed");assert.throws(()=>f.run("verify"));}));
test("missing buildscript lock cannot reach Gradle",()=>isolated(f=>{delete f.replay.gradleLocks["buildscript-gradle.lockfile"];f.refresh();f.generated();assert.throws(()=>f.run("verify"));}));
test("scope cannot cross source/specification identity",()=>isolated(f=>{f.replay.scope.specificationFingerprint="c".repeat(64);f.refresh();assert.throws(()=>f.run());}));
test("native installation uses reviewed npm ci and strict Gradle policy",()=>{const script=androidBuildScript("8.0.0");assert(!script.includes("npm install"));assert(script.includes("native-replay.cjs prepare 8.0.0"));assert(script.includes("native-replay.cjs verify 8.0.0"));assert(script.includes("--dependency-verification=strict"));assert(script.includes("--init-script /input/enforce-locks.gradle"));assert(ANDROID_GRADLE_LOCK_POLICY.includes("LockMode.STRICT"));assert(ANDROID_GRADLE_LOCK_POLICY.includes("activateDependencyLocking()"));});
