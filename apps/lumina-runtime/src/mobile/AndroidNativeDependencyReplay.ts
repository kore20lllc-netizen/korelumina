/** Trusted replay policy, mounted read-only by Runtime and executed only in the
 * existing isolated Android container. No dependency resolution on the host. */
export const ANDROID_NATIVE_REPLAY_SCRIPT = String.raw`
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root='/opt/mobile',native='/work/native',android=native+'/android';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const safe=p=>{assert(typeof p==='string' && p.length<512 && !p.startsWith('/') && !p.split('/').some(x=>!x||x==='.'||x==='..') && !/[\\\x00-\x1f]/.test(p));return p;};
const read=p=>{const s=fs.lstatSync(p);assert(s.isFile()&&!s.isSymbolicLink()&&s.size<=100000000);assert.equal(fs.realpathSync(p),p);return fs.readFileSync(p);};
const json=p=>JSON.parse(read(p).toString('utf8'));
const integrity=json(root+'/integrity.json');
function trusted(relative){safe(relative);const bytes=read(root+'/'+relative);assert(/^[a-f0-9]{64}$/.test(integrity.files[relative]));assert.equal(hash(bytes),integrity.files[relative]);return bytes;}
const replay=JSON.parse(trusted('locks/native-replay.json'));
assert.equal(replay.schemaVersion,'android-native-replay:v1');
assert.equal(replay.capacitorVersion,process.argv[3]);assert.equal(replay.capacitorVersion,'8.0.0');
assert.equal(replay.gradleVersion,'8.14.3');assert.equal(replay.agpVersion,'8.13.0');
assert.equal(replay.closureComplete,true);
const plan=json('/input/plan.json');
for(const field of ['applicationIdentifier','version','buildNumber','sourceSnapshotFingerprint','specificationFingerprint'])assert.deepEqual(replay.scope[field],plan[field]);
const pkgBytes=trusted('locks/native-package.json'),lockBytes=trusted('locks/native-package-lock.json'),metadata=trusted('locks/verification-metadata.xml');
assert.equal(hash(lockBytes),replay.nativePackageLockSha256);assert.equal(hash(metadata),replay.verificationMetadataSha256);
const pkg=JSON.parse(pkgBytes),lock=JSON.parse(lockBytes);
assert.equal(pkg.name,'korelumina-native-wrapper');assert.equal(pkg.version,'1.0.0');assert.equal(pkg.private,true);
assert(Object.keys(pkg).every(k=>['name','version','private','dependencies'].includes(k)));
const dependencies={'@capacitor/cli':replay.capacitorVersion,'@capacitor/core':replay.capacitorVersion,'@capacitor/android':replay.capacitorVersion};
assert.deepEqual(pkg.dependencies,dependencies);assert.equal(lock.lockfileVersion,3);
assert.equal(lock.packages[''].name,pkg.name);assert.equal(lock.packages[''].version,pkg.version);assert.deepEqual(lock.packages[''].dependencies,dependencies);
for(const name of Object.keys(dependencies))assert.equal(lock.packages['node_modules/'+name]?.version,replay.capacitorVersion);
for(const [name,value] of Object.entries(lock.packages)){
 if(!name)continue;safe(name);assert(!value.link && /^https:\/\/registry\.npmjs\.org\//.test(value.resolved));assert(/^sha512-[A-Za-z0-9+/]+=*$/.test(value.integrity));
 for(const dep of Object.keys({...value.dependencies,...value.optionalDependencies})){
  let parent=name,found=false;while(true){if(lock.packages[parent+'/node_modules/'+dep]){found=true;break;}if(parent.includes('/node_modules/'))parent=parent.slice(0,parent.lastIndexOf('/node_modules/'));else if(parent)parent='';else break;}
  assert(found||lock.packages['node_modules/'+dep],'Incomplete native npm closure');
 }
}
const xml=metadata.toString();assert(!/<!DOCTYPE|<!ENTITY|<trusted-artifacts|<ignored-keys/.test(xml));
assert(xml.includes('<verify-metadata>true</verify-metadata>') && /<sha256 value="[a-f0-9]{64}"/.test(xml));
assert(integrity.nativeClosureComplete===true && integrity.mavenStrictOfflineVerified===true);
// Verify every immutable seed-cache byte; unexpected cache files are forbidden.
for(const prefix of ['cache/npm/','cache/gradle/']){
 const expected=Object.keys(integrity.files).filter(k=>k.startsWith(prefix)).sort();assert(expected.length>0);
 const actual=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=dir+'/'+e.name;assert(!e.isSymbolicLink());if(e.isDirectory())walk(f);else {assert(e.isFile());const rel=f.slice(root.length+1);trusted(rel);actual.push(rel);}}}walk(root+'/'+prefix.slice(0,-1));assert.deepEqual(actual.sort(),expected);
}
const phase=process.argv[2];assert(['prepare','verify'].includes(phase));
if(phase==='prepare'){
 fs.mkdirSync(native,{recursive:true});assert.equal(fs.realpathSync(native),native);assert(!fs.lstatSync(native).isSymbolicLink());
 assert.equal(fs.realpathSync('/work/home'),'/work/home');
 // Discard mutable cache state touched by the web build; replay only verified seeds.
 for(const [source,destination] of [[root+'/cache/npm','/work/npm-cache'],[root+'/cache/gradle','/work/home/.gradle']]){fs.rmSync(destination,{recursive:true,force:true});fs.cpSync(source,destination,{recursive:true});}
 fs.writeFileSync(native+'/package.json',pkgBytes,{flag:'wx'});fs.writeFileSync(native+'/package-lock.json',lockBytes,{flag:'wx'});
}else{
 assert.equal(hash(read(native+'/package.json')),hash(pkgBytes));assert.equal(hash(read(native+'/package-lock.json')),hash(lockBytes));
 // Exact reviewed post-Capacitor/configuration build controls, before adding locks.
 const controls={};function controlsIn(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){assert(!e.isSymbolicLink());const f=dir+'/'+e.name;if(e.isDirectory())controlsIn(f);else if(/\.lockfile$/.test(f))throw Error('Unexpected preexisting Gradle lock');else if(/\.(?:gradle|gradle\.kts|properties)$/.test(f)||/\/gradlew(?:\.bat)?$/.test(f)||/\/gradle-wrapper\.jar$/.test(f))controls[f.slice(android.length+1)]=hash(read(f));}}controlsIn(android);
 assert.deepEqual(controls,replay.generatedControls,'Generated wrapper differs from reviewed build controls');
 for(const required of ['build.gradle','app/build.gradle','settings.gradle','variables.gradle','gradle/wrapper/gradle-wrapper.properties','gradle/wrapper/gradle-wrapper.jar','gradlew'])assert(Object.hasOwn(controls,required));
 assert(read(android+'/build.gradle').toString().includes('com.android.tools.build:gradle:8.13.0'));
 const propertyFile=android+'/gradle/wrapper/gradle-wrapper.properties';let properties=read(propertyFile).toString();
 assert(/^distributionUrl=https\\:\/\/services\.gradle\.org\/distributions\/gradle-8\.14\.3-all\.zip$/m.test(properties));
 const distributionHash='ed1a8d686605fd7c23bdf62c7fc7add1c5b23b2bbc3721e661934ef4a4911d7c';
 const prior=properties.match(/^distributionSha256Sum=(.*)$/m);if(prior)assert.equal(prior[1],distributionHash);else properties+='\ndistributionSha256Sum='+distributionHash+'\n';
 assert.equal(hash(read(root+'/archives/gradle-all.zip')),distributionHash,'Unverified Gradle distribution');
 // Require complete locks for both normal and buildscript configurations.
 assert(replay.gradleLocks && Object.keys(replay.gradleLocks).length>0);
 assert(Object.hasOwn(replay.gradleLocks,'buildscript-gradle.lockfile'));assert(Object.hasOwn(replay.gradleLocks,'app/gradle.lockfile'));
 for(const [relative,expected] of Object.entries(replay.gradleLocks)){
  safe(relative);assert(/(?:^|\/)(?:buildscript-)?gradle\.lockfile$/.test(relative));
  const bytes=trusted('locks/gradle-locks/'+relative);assert.equal(hash(bytes),expected);
  fs.mkdirSync(path.dirname(android+'/'+relative),{recursive:true});fs.writeFileSync(android+'/'+relative,bytes);
 }
 assert(!fs.existsSync(android+'/gradle/verification-metadata.xml'),'Unexpected verification metadata');
 fs.mkdirSync(android+'/gradle',{recursive:true});fs.writeFileSync(android+'/gradle/verification-metadata.xml',metadata);fs.writeFileSync(propertyFile,properties);
}
`;
export const ANDROID_GRADLE_LOCK_POLICY = String.raw`
import org.gradle.api.artifacts.dsl.LockMode
allprojects {
    dependencyLocking {
        lockAllConfigurations()
        lockMode = LockMode.STRICT
    }
    buildscript {
        configurations.configureEach {
            resolutionStrategy.activateDependencyLocking()
        }
    }
}
`;
