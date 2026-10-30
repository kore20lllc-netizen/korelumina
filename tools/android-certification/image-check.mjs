// Executed only during separately approved offline image assembly / verification.
// No network, dependency resolution or project scripts. Reads actual bytes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const read = file => fs.readFileSync(file);
const json = file => JSON.parse(read(file));
const t=json('/opt/mobile/versions.json');
const digest=(bytes,algorithm='sha256')=>createHash(algorithm).update(bytes).digest('hex');
assert.equal(process.versions.node,t.node);
assert.equal(execFileSync('npm',['--version'],{encoding:'utf8'}).trim(),t.npm);
const release=read(path.join(process.env.JAVA_HOME,'release')).toString();
const actualJava=release.match(/^JAVA_RUNTIME_VERSION="([^"]+)"/m)?.[1]?.replace(/-LTS.*$/,'');
assert.equal(actualJava,t.jdkBuild);
function properties(file) {
 return Object.fromEntries(read(file).toString().split('\n').filter(line=>line.includes('=')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i).trim(),line.slice(i+1).trim()];}));
}
assert.equal(properties('/opt/android-sdk/cmdline-tools/19.0/source.properties')['Pkg.Revision'],t.commandLineTools.revision);
assert.equal(properties('/opt/android-sdk/build-tools/35.0.0/source.properties')['Pkg.Revision'],t.buildToolsVersion);
const platform=properties('/opt/android-sdk/platforms/android-36/source.properties');
assert.equal(Number(platform['AndroidVersion.ApiLevel']),t.compileSdk);
assert.equal(Number(platform['Pkg.Revision']),t.sdkPlatformRevision);
for (const [file,algorithm,expected] of [['node.tar.xz','sha256',t.nodeLinuxX64Sha256],['android-tools.zip','sha1',t.commandLineTools.publisherSha1],['gradle-all.zip','sha256',t.gradleDistributionSha256]]) assert.equal(digest(read('/opt/mobile/archives/'+file),algorithm),expected);
const native=json('/opt/mobile/locks/native-package-lock.json');
for (const name of ['cli','core','android']) assert.equal(native.packages['node_modules/@capacitor/'+name]?.version,t.capacitorVersion);
const manifest=json('/opt/mobile/integrity.json');
const allowedRoots=['cache/npm/','cache/gradle/','locks/','tarballs/'];
const files={};
function walk(directory) {
 for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
  const file=path.join(directory,entry.name);assert(!entry.isSymbolicLink());
  if(entry.isDirectory())walk(file);else {assert(entry.isFile());files[path.relative('/opt/mobile',file)]=digest(read(file));}
 }
}
for(const directory of allowedRoots)walk('/opt/mobile/'+directory);
assert.deepEqual(files,manifest.files,'Incomplete or modified offline input manifest');
// Every npm package in BOTH real locks must have its registry tarball verified.
for(const lock of [native,json('/opt/mobile/locks/fixture-package-lock.json')]) {
 for(const [name,pkg] of Object.entries(lock.packages)) {
  if(!name)continue;assert(/^sha512-/.test(pkg.integrity));
  const tar=manifest.npmTarballs[pkg.resolved];assert(tar && tar.startsWith('tarballs/') && !tar.includes('..'));
  const sri='sha512-'+createHash('sha512').update(read('/opt/mobile/'+tar)).digest('base64');assert.equal(sri,pkg.integrity);
 }
}
const xml=read('/opt/mobile/locks/verification-metadata.xml').toString();
assert(!/<!DOCTYPE|<!ENTITY/.test(xml));assert(xml.includes('<verify-metadata>true</verify-metadata>'));
assert(!xml.includes('<trusted-artifacts>') && !xml.includes('<ignored-keys>'));
assert(/<sha256 value="[a-f0-9]{64}"/.test(xml));
assert.equal(digest(read('/opt/mobile/locks/verification-metadata.xml')),manifest.mavenVerificationMetadataSha256);
// Exact cache file hashes + independently reviewed complete Maven graph are required;
// the unchanged adapter does not itself enforce Gradle strict verification flags.
assert.equal(manifest.nativeClosureComplete,true);assert.equal(manifest.mavenStrictOfflineVerified,true);
assert.equal(manifest.agpVersion,t.androidGradlePlugin);
console.log(JSON.stringify({node:t.node,npm:t.npm,jdk:actualJava,capacitor:t.capacitorVersion,gradle:t.gradle,agp:t.androidGradlePlugin,buildTools:t.buildToolsVersion,compileSdk:t.compileSdk,platformRevision:t.sdkPlatformRevision,commandLineTools:t.commandLineTools.revision}));
