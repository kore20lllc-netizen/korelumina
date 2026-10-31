// Local-only preparation. No fetch, HTTP client, installer or acquisition callback.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { inventory, verifyOfflineNpm, hash } from './offline-npm.mjs';
import { validateFixtureLock } from './contracts.mjs';
const check = signal => { assert(!signal?.aborted,'Preparation cancelled'); };
function canonical(directory) {
 assert(path.isAbsolute(directory) && fs.realpathSync(directory)===directory,'Unsafe directory');
 let current=path.parse(directory).root;
 for(const segment of directory.slice(current.length).split('/')) { current=path.join(current,segment);assert(!fs.lstatSync(current).isSymbolicLink(),'Symlinked directory'); }
 return directory;
}
function bytes(file,limit) {
 canonical(path.dirname(file));const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 try {const s=fs.fstatSync(fd);assert(s.isFile()&&s.size<=limit,'Artifact byte limit');return fs.readFileSync(fd);} finally {fs.closeSync(fd);}
}
const syncDir = directory => {const fd=fs.openSync(directory,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}};
/** expectedArtifacts defaults to the complete 132-reference reviewed certification set.
 * Smaller counts are explicit fixture/test contracts, never inferred from missing files.
 * limits require maxArtifacts, maxArtifactBytes and maxTotalBytes (unique payload bytes).
 */
export function prepareNpmCache(options) {
 const {locks,sourceCache,destination,limits,signal,expectedArtifacts=132}=options;
 assert(Object.keys(options).every(k=>['locks','sourceCache','destination','limits','signal','expectedArtifacts'].includes(k)),'Network/acquisition options are prohibited');
 assert(limits && ['maxArtifacts','maxArtifactBytes','maxTotalBytes'].every(k=>Number.isSafeInteger(limits[k])&&limits[k]>0),'Explicit positive limits required');
 assert(limits.maxArtifactBytes<=256*1024**2);check(signal);
 const plan=inventory(locks);assert(Number.isSafeInteger(expectedArtifacts)&&expectedArtifacts>0);
 assert.equal(plan.artifacts.length,expectedArtifacts,'Incomplete artifact reference inventory');assert(plan.artifacts.length<=limits.maxArtifacts,'Artifact count limit');
 for(const l of locks){const parsed=JSON.parse(l.bytes);validateFixtureLock(parsed.packages[''],parsed);}
 assert(typeof destination==='string' && path.resolve(destination)===destination && !/[\\\x00-\x20]/.test(destination),'Unsafe destination path');
 canonical(sourceCache);canonical(path.dirname(destination));
 assert(!destination.startsWith(sourceCache+'/')&&!sourceCache.startsWith(destination+'/')&&destination!==sourceCache,'Shared-cache overlap');
 if(!fs.existsSync(destination))fs.mkdirSync(destination,{mode:0o700});canonical(destination);
 const stat=fs.statSync(destination);assert(stat.isDirectory()&&!(stat.mode&0o077)&&(!process.getuid||stat.uid===process.getuid()),'Private owned destination required');
 const binding={schemaVersion:'klm-npm-preparation-plan:v1',locks:plan.locks,expectedArtifacts,limits};
 const writeAtomic=(file,data)=>{
   check(signal);canonical(path.dirname(file));const pending=path.join(destination,'.pending');
   const fd=fs.openSync(pending,'wx',0o600);try{fs.writeFileSync(fd,data);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
   check(signal);fs.renameSync(pending,file);syncDir(path.dirname(file));
 };
 const lock=path.join(destination,'.owner-lock');const lockFd=fs.openSync(lock,'wx',0o600);
 try {
  // A stale owner lock after process death needs explicit operator recovery; never steal it.
  const allowed=new Set(['.owner-lock','.pending','plan.json','receipt.json','cache']);
  for(const e of fs.readdirSync(destination,{withFileTypes:true})){assert(allowed.has(e.name)&&!e.isSymbolicLink(),'Unexpected preparation content');}
  const pending=path.join(destination,'.pending');if(fs.existsSync(pending)){assert(fs.lstatSync(pending).isFile());fs.unlinkSync(pending);}
  const planFile=path.join(destination,'plan.json');
  if(fs.existsSync(planFile))assert.deepEqual(JSON.parse(bytes(planFile,65536)),binding,'Preparation identity mismatch');
  else {assert(!fs.existsSync(path.join(destination,'cache'))&&!fs.existsSync(path.join(destination,'receipt.json')),'Missing preparation identity');writeAtomic(planFile,Buffer.from(JSON.stringify(binding)));}
  const parent=path.join(destination,'cache');fs.mkdirSync(parent,{recursive:true,mode:0o700});canonical(parent);
  assert(fs.readdirSync(parent).every(n=>n==='npm'),'Unexpected cache parent');
  const npm=path.join(parent,'npm');fs.mkdirSync(npm,{recursive:true,mode:0o700});canonical(npm);
  assert(fs.readdirSync(npm).every(n=>n==='_cacache'),'Unexpected npm cache parent');
  const cache=path.join(npm,'_cacache');fs.mkdirSync(cache,{recursive:true,mode:0o700});canonical(cache);
  // Strictly rehash all destination content, including work interrupted before an index commit.
  let current=verifyOfflineNpm({locks,cacheRoot:cache});
  const receiptFile=path.join(destination,'receipt.json');
  if(fs.existsSync(receiptFile)){
   const old=JSON.parse(bytes(receiptFile,4*1024**2));
   assert.equal(old.schemaVersion,'klm-npm-preparation-receipt:v1');assert.equal(old.planSha256,hash(JSON.stringify(binding)));
   assert(Array.isArray(old.artifacts)&&old.artifacts.length<=current.verified.length,'Inconsistent receipt');
   assert.deepEqual(Object.keys(old).sort(),['artifacts','complete','offlineInstallationVerified','planSha256','schemaVersion'].sort());
   assert.equal(old.offlineInstallationVerified,false);assert.equal(old.complete,old.artifacts.length===expectedArtifacts);
   const seen=new Set();for(const a of old.artifacts){assert(!seen.has(a.url));seen.add(a.url);const v=current.verified.find(v=>v.url===a.url);assert(v);assert.deepEqual(a,{url:v.url,integrity:v.integrity,sha256:v.sha256,bytes:v.bytes});}
  }
  const source=verifyOfflineNpm({locks,cacheRoot:sourceCache,strictCache:false});
  const reusable=new Map(source.verified.map(a=>[a.url,a]));const groups=new Map();
  for(const a of plan.artifacts){if(!groups.has(a.integrity))groups.set(a.integrity,[]);groups.get(a.integrity).push(a);}
  let total=0;
  for(const group of groups.values()) {
   check(signal);const first=group[0];let data;
   const target=path.join(cache,first.contentPath);
   if(fs.existsSync(target))data=bytes(target,limits.maxArtifactBytes);
   else {const entry=group.find(a=>reusable.has(a.url));if(!entry)continue;data=bytes(path.join(sourceCache,entry.contentPath),limits.maxArtifactBytes);}
   assert.equal('sha512-'+hash(data,'sha512','base64'),first.integrity,'Artifact substitution');
   total+=data.length;assert(total<=limits.maxTotalBytes,'Total byte limit');
   fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});canonical(path.dirname(target));
   if(!fs.existsSync(target))writeAtomic(target,data);
   // Content and directory are durable before any index references it.
   for(const a of group){check(signal);const file=path.join(cache,a.indexPath);fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});canonical(path.dirname(file));
    const entry=JSON.stringify({key:a.cacheKey,integrity:a.integrity,size:data.length,time:0});
    writeAtomic(file,Buffer.from('\n'+hash(entry,'sha1')+'\t'+entry));
   }
  }
  current=verifyOfflineNpm({locks,cacheRoot:cache});
  const artifacts=current.verified.map(a=>({url:a.url,integrity:a.integrity,sha256:a.sha256,bytes:a.bytes}));
  const receipt={schemaVersion:'klm-npm-preparation-receipt:v1',planSha256:hash(JSON.stringify(binding)),artifacts,complete:current.complete,offlineInstallationVerified:false};
  writeAtomic(receiptFile,Buffer.from(JSON.stringify(receipt)));check(signal);
  return {receipt,inventory:current,uniqueIntegrityIdentities:groups.size,networkEnabled:false};
 } finally {
  fs.closeSync(lockFd);fs.unlinkSync(lock);
  const pending=path.join(destination,'.pending');if(fs.existsSync(pending)){assert(fs.lstatSync(pending).isFile()&&!fs.lstatSync(pending).isSymbolicLink());fs.unlinkSync(pending);}
  syncDir(destination);
 }
}
