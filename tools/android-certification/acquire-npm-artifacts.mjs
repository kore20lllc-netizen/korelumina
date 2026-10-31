// Acquisition authority is NOT integrated. No public API can invoke a transport.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { isIP } from 'node:net';
import { inventory, verifyOfflineNpm, hash } from './offline-npm.mjs';
import { prepareNpmCache } from './prepare-npm-cache.mjs';
export const ACQUISITION_LIMITS=Object.freeze({artifactBytes:64*1024**2,totalBytes:256*1024**2,requestMs:30000,overallMs:600000,transfers:36,retries:0});
function makePlan(locks,expectedLockSetFingerprint,expectedReferences=132) {
 const result=inventory(locks);assert.equal(result.artifacts.length,expectedReferences,'Incomplete reviewed inventory');
 const lockSetFingerprint=hash(JSON.stringify(result.locks));assert.equal(lockSetFingerprint,expectedLockSetFingerprint,'Lock-set fingerprint mismatch');
 return {...result,lockSetFingerprint};
}
export function planNpmAcquisition({locks,expectedLockSetFingerprint}) {return makePlan(locks,expectedLockSetFingerprint);}
export async function acquireNpmArtifacts() {
 // Existing permit scope is one-debug-apk, not dependency acquisition. Never repurpose it.
 throw Error('acquisition_authorization_unavailable');
}
function directory(root) {
 assert(path.isAbsolute(root)&&path.resolve(root)===root&&fs.realpathSync(root)===root,'Unsafe acquisition root');
 let parent=path.parse(root).root;for(const part of root.slice(parent.length).split('/')){parent=path.join(parent,part);assert(!fs.lstatSync(parent).isSymbolicLink(),'Symlinked acquisition path');}
 const stat=fs.statSync(root);assert(stat.isDirectory()&&!(stat.mode&0o077)&&(!process.getuid||stat.uid===process.getuid()),'Private owned root required');
}
function identity(response,a) {
 assert.equal(response.url,a.url,'Response URL substitution');assert.equal(response.status,200,'Redirect or unexpected response');
 const u=new URL(response.url);assert(u.protocol==='https:'&&u.host==='registry.npmjs.org'&&!u.username&&!u.password,'Invalid TLS URL identity');
 assert.equal(response.tlsAuthorized,true,'Invalid TLS');assert.equal(response.servername,'registry.npmjs.org','Invalid TLS name');assert.equal(response.remotePort,443);
 // A future trusted connector must obtain these facts from DNS/TLS/socket APIs,
 // never HTTP headers or caller claims. This private synthetic interface is not production authority.
 assert(Array.isArray(response.approvedAddresses)&&response.approvedAddresses.length>0);
 for(const ip of response.approvedAddresses){assert(isIP(ip)===4,'Unsupported DNS address');const n=ip.split('.').map(Number);assert(!(n[0]===0||n[0]===10||n[0]===127||n[0]>=224||n[0]===169&&n[1]===254||n[0]===172&&n[1]>=16&&n[1]<=31||n[0]===192&&n[1]===168||n[0]===100&&n[1]>=64&&n[1]<=127),'Unsafe DNS destination');}
 assert(response.approvedAddresses.includes(response.remoteAddress),'Connection destination mismatch');
 assert.equal(response.contentEncoding,'identity','Unexpected transfer encoding');
 assert(Number.isSafeInteger(response.contentLength)&&response.contentLength>0,'Missing response length');
}
/** Private orchestration core: reachable only by lexical test instrumentation.
 * No transport implementation, factory, environment gate or callback is exported.
 * policy parameter is for scaled synthetic limits, never a public override.
 */
async function runAcquisition(job,transport,policy=ACQUISITION_LIMITS) {
 const {locks,expectedLockSetFingerprint,root,sourceCache,signal,expectedReferences=132}=job;
 const plan=makePlan(locks,expectedLockSetFingerprint,expectedReferences);directory(root);
 const owned=new Set(['.acquisition-owner','transfer.part','index.part','seed','prepared']);
 for(const e of fs.readdirSync(root,{withFileTypes:true}))assert(owned.has(e.name)&&!e.isSymbolicLink(),'Unexpected acquisition content');
 const owner=path.join(root,'.acquisition-owner'),ownerFd=fs.openSync(owner,'wx',0o600);
 const temporary=path.join(root,'transfer.part');const controller=new AbortController();
 const abort=()=>controller.abort(Error('Acquisition cancelled'));signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 const overall=setTimeout(()=>controller.abort(Error('Overall timeout')),policy.overallMs);
 let received=0,transfers=0;
 const check=()=>{if(controller.signal.aborted)throw controller.signal.reason;};
 const bounded=async (operation,ms,child)=>{
  let timer,onAbort;
  try{return await Promise.race([operation,new Promise((_,reject)=>{onAbort=()=>reject(child.signal.reason);child.signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>child.abort(Error('Request timeout')),ms);if(child.signal.aborted)onAbort();})]);}
  finally {clearTimeout(timer);child.signal.removeEventListener('abort',onAbort);}
 };
 try {
  check();for(const file of [temporary,path.join(root,'index.part')])if(fs.existsSync(file)){assert(fs.lstatSync(file).isFile());fs.unlinkSync(file);}
  const limits={maxArtifacts:plan.artifacts.length,maxArtifactBytes:policy.artifactBytes,maxTotalBytes:policy.totalBytes};
  prepareNpmCache({locks,sourceCache,destination:root+'/seed',limits,expectedArtifacts:expectedReferences,signal:controller.signal});
  const seed=root+'/seed/cache/npm/_cacache';let report=verifyOfflineNpm({locks,cacheRoot:seed});
  const groups=new Map();for(const a of report.missing){if(!groups.has(a.integrity))groups.set(a.integrity,[]);groups.get(a.integrity).push(a);}
  assert(groups.size<=policy.transfers,'Transfer count limit');
  for(const group of groups.values()) {
   check();const a=group[0];assert(++transfers<=policy.transfers,'Transfer count limit');
   const child=new AbortController(),relay=()=>child.abort(controller.signal.reason);controller.signal.addEventListener('abort',relay,{once:true});
   let fd,response;const task=(async()=>{
    response=await transport({url:a.url,integrity:a.integrity,references:a.references,lockSetFingerprint:plan.lockSetFingerprint,signal:child.signal});
    if(child.signal.aborted)throw child.signal.reason;identity(response,a);assert(response.contentLength<=policy.artifactBytes,'Artifact byte limit');
    fd=fs.openSync(temporary,'wx',0o600);let size=0;
    for await(const chunk of response.body){if(child.signal.aborted)throw child.signal.reason;assert(Buffer.isBuffer(chunk),'Unexpected payload');size+=chunk.length;received+=chunk.length;assert(size<=policy.artifactBytes,'Artifact byte limit');assert(received<=policy.totalBytes,'Aggregate byte limit');fs.writeFileSync(fd,chunk);}
    assert.equal(size,response.contentLength,'Truncated response');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;
    const bytes=fs.readFileSync(temporary);assert.equal('sha512-'+hash(bytes,'sha512','base64'),a.integrity,'SHA-512 mismatch');return bytes;
   })();
   let bytes;
   try{bytes=await bounded(task,policy.requestMs,child);}finally{child.abort(Error('Transfer ended'));controller.signal.removeEventListener('abort',relay);if(fd!==undefined){fs.closeSync(fd);fd=undefined;}response?.body?.destroy?.();}
   check();
   // Quarantine is input only. The sole final cache publication remains R6B.
   const publish=(file,data)=>{fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});directory(path.dirname(file));const pending=path.join(root,'index.part');const out=fs.openSync(pending,'wx',0o600);try{fs.writeFileSync(out,data);fs.fsyncSync(out);}finally{fs.closeSync(out);}fs.renameSync(pending,file);const dir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}};
   const content=path.join(seed,a.contentPath);if(!fs.existsSync(content))publish(content,bytes);
   for(const ref of group){const file=path.join(seed,ref.indexPath);if(!fs.existsSync(file)){const entry=JSON.stringify({key:ref.cacheKey,integrity:ref.integrity,size:bytes.length,time:0});publish(file,Buffer.from('\n'+hash(entry,'sha1')+'\t'+entry));}}
   fs.unlinkSync(temporary);
  }
  check();report=verifyOfflineNpm({locks,cacheRoot:seed});assert(report.complete,'Incomplete acquisition closure');
  const prepared=prepareNpmCache({locks,sourceCache:seed,destination:root+'/prepared',limits,expectedArtifacts:expectedReferences,signal:controller.signal});assert(prepared.receipt.complete,'Incomplete final closure');check();
  return {schemaVersion:'klm-npm-acquisition:v1',lockSetFingerprint:plan.lockSetFingerprint,limits:policy,artifacts:prepared.receipt.artifacts,complete:true,offlineInstallationVerified:false};
 } finally {
  controller.abort(Error('Acquisition ended'));clearTimeout(overall);signal?.removeEventListener('abort',abort);
  for(const file of [temporary,path.join(root,'index.part')])if(fs.existsSync(file)){assert(fs.lstatSync(file).isFile()&&!fs.lstatSync(file).isSymbolicLink());fs.unlinkSync(file);}
  fs.closeSync(ownerFd);fs.unlinkSync(owner);
 }
}
