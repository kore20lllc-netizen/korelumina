// Acquisition authority is NOT integrated. No public API can invoke a transport.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { isIP } from 'node:net';
import { createPublicKey, verify, createHmac, timingSafeEqual } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import tls from 'node:tls';
import https from 'node:https';
import { inventory, verifyOfflineNpm, hash } from './offline-npm.mjs';
import { prepareNpmCache } from './prepare-npm-cache.mjs';
export const ACQUISITION_LIMITS=Object.freeze({artifactBytes:64*1024**2,totalBytes:256*1024**2,requestMs:30000,overallMs:600000,transfers:36,retries:0});
function makePlan(locks,expectedLockSetFingerprint,expectedReferences=132) {
 const result=inventory(locks);assert.equal(result.artifacts.length,expectedReferences,'Incomplete reviewed inventory');
 const lockSetFingerprint=hash(JSON.stringify(result.locks));assert.equal(lockSetFingerprint,expectedLockSetFingerprint,'Lock-set fingerprint mismatch');
 return {...result,lockSetFingerprint};
}
export function planNpmAcquisition({locks,expectedLockSetFingerprint}) {return makePlan(locks,expectedLockSetFingerprint);}
// Independently governed production trust/budget configuration is intentionally absent.
// Neither caller keys, environment variables nor transport callbacks can supply it.
const ACQUISITION_AUTHORITY=null;
export async function acquireNpmArtifacts(options) {
 assert(ACQUISITION_AUTHORITY,'acquisition_authorization_unavailable');
 assert(Object.keys(options).every(k=>['locks','expectedLockSetFingerprint','root','sourceCache','signal','permit'].includes(k)),'Untrusted acquisition option');
 const plan=makePlan(options.locks,options.expectedLockSetFingerprint);
 const grant=verifyAcquisitionGrant(options.permit,ACQUISITION_AUTHORITY.publicKey,plan);
 const budget=new AcquisitionBudget(ACQUISITION_AUTHORITY.budgetRoot,ACQUISITION_AUTHORITY.budgetKey,grant);
 budget.start();
 try {const result=await runAcquisition(options,request=>trustedTransport(request,grant),ACQUISITION_LIMITS,budget);budget.close(true);return result;}
 catch(error){budget.close(false);throw error;}
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
async function runAcquisition(job,transport,policy=ACQUISITION_LIMITS,budget=null) {
 const {locks,expectedLockSetFingerprint,root,sourceCache,signal,expectedReferences=132}=job;
 const plan=makePlan(locks,expectedLockSetFingerprint,expectedReferences);directory(root);
 const owned=new Set(['.acquisition-owner','transfer.part','index.part','seed','prepared']);
 for(const e of fs.readdirSync(root,{withFileTypes:true}))assert(owned.has(e.name)&&!e.isSymbolicLink(),'Unexpected acquisition content');
 const owner=path.join(root,'.acquisition-owner'),ownerFd=fs.openSync(owner,'wx',0o600);
 const temporary=path.join(root,'transfer.part');const controller=new AbortController();
 const abort=()=>controller.abort(Error('Acquisition cancelled'));signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 const overall=setTimeout(()=>controller.abort(Error('Overall timeout')),Math.min(policy.overallMs,budget?Math.max(0,budget.grant.expiresAt-Date.now()):policy.overallMs));
 let received=0,transfers=0;const started=performance.now();
 const check=()=>{if(performance.now()-started>=policy.overallMs)controller.abort(Error('Overall timeout'));if(budget&&Date.now()>=budget.grant.expiresAt)controller.abort(Error('Authorization deadline'));if(controller.signal.aborted)throw controller.signal.reason;};
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
   check();const a=group[0];assert(++transfers<=policy.transfers,'Transfer count limit');budget?.reserve(a.integrity);
   const child=new AbortController(),relay=()=>child.abort(controller.signal.reason);controller.signal.addEventListener('abort',relay,{once:true});
   let fd,response;const requestDeadline=performance.now()+policy.requestMs;const task=(async()=>{
    response=await transport({url:a.url,integrity:a.integrity,references:a.references,lockSetFingerprint:plan.lockSetFingerprint,signal:child.signal});
    if(child.signal.aborted)throw child.signal.reason;identity(response,a);assert(response.contentLength<=policy.artifactBytes,'Artifact byte limit');
    fd=fs.openSync(temporary,'wx',0o600);let size=0;
    for await(const chunk of response.body){if(performance.now()>=requestDeadline)child.abort(Error('Request timeout'));if(child.signal.aborted)throw child.signal.reason;assert(Buffer.isBuffer(chunk),'Unexpected payload');size+=chunk.length;received+=chunk.length;budget?.observe(size);assert(size<=policy.artifactBytes,'Artifact byte limit');assert(received<=policy.totalBytes,'Aggregate byte limit');fs.writeFileSync(fd,chunk);}
    assert.equal(size,response.contentLength,'Truncated response');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;
    const bytes=fs.readFileSync(temporary);assert.equal('sha512-'+hash(bytes,'sha512','base64'),a.integrity,'SHA-512 mismatch');return bytes;
   })();
   let bytes;
   try{bytes=await bounded(task,policy.requestMs,child);budget?.settle(bytes.length);}finally{child.abort(Error('Transfer ended'));controller.signal.removeEventListener('abort',relay);if(fd!==undefined){fs.closeSync(fd);fd=undefined;}response?.body?.destroy?.();}
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

// Dedicated grant: signature verification follows the existing raw-payload Ed25519 contract.
const TRANSPORT_DEADLINES=Object.freeze({connectionMs:5000,responseMs:10000});
function publicIPv4(ip) {
 if(isIP(ip)!==4)return false;const [a,b]=ip.split('.').map(Number);
 return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===0||b===168)||a===198&&(b===18||b===19||b===51)||a===203&&b===0||a===100&&b>=64&&b<=127);
}
function verifyAcquisitionGrant(encoded,keyPem,plan,now=Date.now()) {
 assert(typeof encoded==='string'&&encoded.length>0&&encoded.length<=65536&&/^[A-Za-z0-9+/]*={0,2}$/.test(encoded));
 const raw=Buffer.from(encoded,'base64');assert.equal(raw.toString('base64'),encoded);
 const envelope=JSON.parse(raw);assert(typeof envelope.payload==='string'&&typeof envelope.signature==='string');
 const key=createPublicKey(keyPem);assert.equal(key.asymmetricKeyType,'ed25519');
 const signature=Buffer.from(envelope.signature,'base64');assert.equal(signature.length,64);assert.equal(signature.toString('base64'),envelope.signature,'Malformed acquisition signature');
 assert(verify(null,Buffer.from(envelope.payload),key,signature),'Invalid acquisition signature');
 const p=JSON.parse(envelope.payload);
 assert.equal(p.schemaVersion,'klm-npm-acquisition-permit:v1');assert.equal(p.scope,'npm-artifact-acquisition');
 assert.equal(p.repository,'kore20lllc-netizen/korelumina');
 assert.equal(p.lockSetFingerprint,plan.lockSetFingerprint);assert.equal(p.inventorySha256,hash(JSON.stringify(plan.artifacts)));
 assert.equal(p.destination,'https://registry.npmjs.org:443');assert.deepEqual(p.limits,ACQUISITION_LIMITS);assert.deepEqual(p.deadlines,TRANSPORT_DEADLINES);
 for(const id of ['budgetId','attemptId'])assert(typeof p[id]==='string'&&/^[a-f0-9]{64}$/.test(p[id]));
 assert(['create','resume'].includes(p.operation));
 assert(Number.isSafeInteger(p.issuedAt)&&Number.isSafeInteger(p.expiresAt)&&p.issuedAt>0&&p.issuedAt<=now&&now<p.expiresAt&&p.expiresAt-p.issuedAt<=600000,'Expired acquisition grant');
 assert(Array.isArray(p.addresses)&&p.addresses.length>0&&p.addresses.length<=32&&p.addresses.every(publicIPv4),'Unreviewed socket destinations');
 return JSON.parse(JSON.stringify(p));
}
const mac=(key,text)=>createHmac('sha256',key).update(text).digest('hex');
/** Single-host trusted filesystem journal. Reservations are durable BEFORE a socket
 * may open. A failed/crashed transfer forfeits its entire reservation, so bytes
 * received before a crash cannot disappear from the cumulative budget. */
class AcquisitionBudget {
 constructor(root,key,grant){directory(root);assert(Buffer.isBuffer(key)&&key.length>=32);this.root=root;this.key=Buffer.from(key);this.grant=grant;this.closed=true;this.active=null;}
 read() {
  const file=path.join(this.root,this.grant.budgetId+'.json');const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  let ledger;try{assert(fs.fstatSync(fd).isFile()&&fs.fstatSync(fd).size<4*1024**2);ledger=JSON.parse(fs.readFileSync(fd));}finally{fs.closeSync(fd);}
  assert(Array.isArray(ledger)&&ledger.length>0);let previous='0'.repeat(64),last;
  for(const [sequence,entry] of ledger.entries()){
   assert.equal(entry.sequence,sequence);assert.equal(entry.previous,previous);const body=JSON.stringify({sequence:entry.sequence,previous:entry.previous,state:entry.state});
   assert(typeof entry.mac==='string'&&/^[a-f0-9]{64}$/.test(entry.mac));assert(timingSafeEqual(Buffer.from(mac(this.key,body),'hex'),Buffer.from(entry.mac,'hex')),'Tampered budget evidence');
   previous=hash(JSON.stringify(entry));last=entry.state;
  }
  const anchorFile=path.join(this.root,this.grant.budgetId+'.head');const anchorFd=fs.openSync(anchorFile,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let anchor;try{assert(fs.fstatSync(anchorFd).isFile()&&fs.fstatSync(anchorFd).size<4096);anchor=JSON.parse(fs.readFileSync(anchorFd));}finally{fs.closeSync(anchorFd);}const expected=JSON.stringify({sequence:ledger.length-1,digest:previous});assert.equal(anchor.payload,expected,'Budget history truncated');assert.equal(anchor.mac,mac(this.key,expected),'Tampered budget head');
  assert.equal(last.binding,this.binding());assert(Number.isSafeInteger(last.charged)&&last.charged>=0);
  assert(Number.isSafeInteger(last.transfers)&&last.transfers>=0&&last.transfers<=this.grant.limits.transfers);
  assert(Array.isArray(last.attempts)&&new Set(last.attempts).size===last.attempts.length);
  return {ledger,state:last};
 }
 binding(){const g=this.grant;return hash(JSON.stringify({budgetId:g.budgetId,lockSet:g.lockSetFingerprint,inventory:g.inventorySha256,destination:g.destination,addresses:g.addresses,limits:g.limits,deadlines:g.deadlines,expiresAt:g.expiresAt}));}
 save(state,initial=false){
  const file=path.join(this.root,this.grant.budgetId+'.json'),prior=initial?[]:this.read().ledger;
  const entry={sequence:prior.length,previous:prior.length?hash(JSON.stringify(prior.at(-1))):'0'.repeat(64),state};entry.mac=mac(this.key,JSON.stringify(entry));
  const data=Buffer.from(JSON.stringify([...prior,entry]));const tmp=file+'.pending';const fd=fs.openSync(tmp,'wx',0o600);
  try{fs.writeFileSync(fd,data);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  if(initial){fs.linkSync(tmp,file);fs.unlinkSync(tmp);}else fs.renameSync(tmp,file);
  const head=JSON.stringify({sequence:entry.sequence,digest:hash(JSON.stringify(entry))});const anchor=Buffer.from(JSON.stringify({payload:head,mac:mac(this.key,head)}));const af=fs.openSync(file+'.head-pending','wx',0o600);try{fs.writeFileSync(af,anchor);fs.fsyncSync(af);}finally{fs.closeSync(af);}fs.renameSync(file+'.head-pending',path.join(this.root,this.grant.budgetId+'.head'));
  const d=fs.openSync(this.root,'r');try{fs.fsyncSync(d);}finally{fs.closeSync(d);}
 }
 start(){
  const marker=path.join(this.root,this.grant.budgetId+'.owner');this.fd=fs.openSync(marker,'wx',0o600);this.marker=marker;
  try{
   const spent=path.join(this.root,this.grant.budgetId+'.spent'),token=JSON.stringify({binding:this.binding()});
   if(this.grant.operation==='create'){const stamp=fs.openSync(spent,'wx',0o600);try{fs.writeFileSync(stamp,JSON.stringify({token,mac:mac(this.key,token)}));fs.fsyncSync(stamp);}finally{fs.closeSync(stamp);}const dir=fs.openSync(this.root,'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}}
   else {const stamp=fs.openSync(spent,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let evidence;try{assert(fs.fstatSync(stamp).isFile()&&fs.fstatSync(stamp).size<4096);evidence=JSON.parse(fs.readFileSync(stamp));}finally{fs.closeSync(stamp);}assert.equal(evidence.token,token);assert.equal(evidence.mac,mac(this.key,token),'Tampered spent marker');}
   const exists=fs.existsSync(path.join(this.root,this.grant.budgetId+'.json'));
   if(this.grant.operation==='create')assert(!exists,'Permit replay');else assert(exists,'Missing budget evidence');
   const state=exists?this.read().state:{binding:this.binding(),charged:0,transfers:0,attempts:[],terminal:false};
   assert(!state.overrun&&state.charged<=this.grant.limits.totalBytes,'Cumulative budget exhausted');
   assert(!state.terminal&&!state.attempts.includes(this.grant.attemptId),'Permit replay');
   state.attempts.push(this.grant.attemptId);this.save(state,!exists);this.closed=false;
  }catch(e){fs.closeSync(this.fd);fs.unlinkSync(marker);throw e;}
 }
 reserve(integrity){assert(!this.closed&&!this.active);assert(Date.now()<this.grant.expiresAt,'Expired budget');const state=this.read().state;
  assert(state.transfers<this.grant.limits.transfers);const amount=Math.min(this.grant.limits.artifactBytes,this.grant.limits.totalBytes-state.charged);assert(amount>0,'Cumulative budget exhausted');
  state.charged+=amount;state.transfers++;state.reservation={integrity,amount};this.save(state);this.active={amount};
 }
 observe(size){
  assert(this.active&&Number.isSafeInteger(size)&&size>=(this.active.observed??0));this.active.observed=size;
  if(size>this.active.amount){const state=this.read().state;state.charged+=size-Math.max(this.active.amount,state.reservation.observed??0);state.reservation.observed=size;state.overrun=true;this.save(state);throw Error('Cumulative received-byte limit');}
  // The fsynced reservation already covers every ordinary chunk, including a crash.
  // Avoid rewriting the entire authenticated journal for every network packet.
  assert(Date.now()<this.grant.expiresAt,'Expired budget');
 }

 settle(size){this.observe(size);const state=this.read().state;assert.equal(state.reservation.amount,this.active.amount);state.charged-=this.active.amount-size;delete state.reservation;this.save(state);this.active=null;}
 close(complete){if(this.closed)return;try{const s=this.read().state;s.terminal=complete;if(this.active)s.failedObservedBytes=this.active.observed??0;delete s.reservation;this.save(s);}finally{this.closed=true;fs.closeSync(this.fd);fs.unlinkSync(this.marker);}}
}
function rejectNetworkOverrides(env=process.env){
 for(const k of Object.keys(env))assert(!/^(?:https?_proxy|all_proxy|no_proxy|node_tls_reject_unauthorized|node_extra_ca_certs|node_options|ssl_cert_file|ssl_cert_dir|node_use_system_ca)$/i.test(k)||!env[k],'Proxy/TLS override rejected');
}
async function trustedTransport(request,grant) {
 rejectNetworkOverrides();const u=new URL(request.url);
 assert(u.protocol==='https:'&&u.host==='registry.npmjs.org'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.href===request.url);
 assert(Date.now()<grant.expiresAt);const abort=()=>{throw request.signal.reason;};if(request.signal.aborted)abort();
 let socket,agent,req;const controller=new AbortController();const relay=()=>controller.abort(request.signal.reason);request.signal.addEventListener('abort',relay,{once:true});
 const onAbort=()=>{req?.destroy(controller.signal.reason);socket?.destroy(controller.signal.reason);};controller.signal.addEventListener('abort',onAbort);
 let phase=setTimeout(()=>controller.abort(Error('Connection deadline')),grant.deadlines.connectionMs);
 try{
  const addresses=await Promise.race([lookup('registry.npmjs.org',{all:true,family:4}),new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(controller.signal.reason),{once:true}))]);
  assert(!controller.signal.aborted);assert(addresses.length>0&&addresses.every(a=>publicIPv4(a.address)&&grant.addresses.includes(a.address)),'Unreviewed DNS destination');
  const selected=addresses[0].address;
  socket=await new Promise((resolve,reject)=>{const s=tls.connect({host:selected,port:443,servername:'registry.npmjs.org',rejectUnauthorized:true,ca:tls.rootCertificates,checkServerIdentity:tls.checkServerIdentity,minVersion:'TLSv1.2'});socket=s;s.once('error',reject);s.once('secureConnect',()=>{
   try{assert(s.authorized&&s.remoteAddress===selected&&s.remotePort===443);assert(!tls.checkServerIdentity('registry.npmjs.org',s.getPeerCertificate()));resolve(s);}catch(e){s.destroy();reject(e);}
  });});
  clearTimeout(phase);phase=setTimeout(()=>controller.abort(Error('Response deadline')),grant.deadlines.responseMs);
  assert(!controller.signal.aborted);
  agent=new https.Agent({keepAlive:false,maxSockets:1});agent.createConnection=(_options,callback)=>{callback(null,socket);};
  const response=await new Promise((resolve,reject)=>{req=https.request(u,{method:'GET',agent,headers:{Accept:'application/octet-stream','Accept-Encoding':'identity'},maxHeaderSize:16384},resolve);req.once('error',reject);req.end();});
  clearTimeout(phase);assert.equal(response.statusCode,200,'Redirect or unexpected status');
  assert(!response.headers['content-encoding']||response.headers['content-encoding']==='identity');assert(/^\d+$/.test(response.headers['content-length']??''));
  response.once('close',()=>{request.signal.removeEventListener('abort',relay);agent.destroy();});
  return {url:request.url,status:response.statusCode,tlsAuthorized:socket.authorized,servername:'registry.npmjs.org',remotePort:socket.remotePort,remoteAddress:socket.remoteAddress,approvedAddresses:grant.addresses,contentEncoding:'identity',contentLength:Number(response.headers['content-length']),body:response};
 }catch(e){socket?.destroy();agent?.destroy();request.signal.removeEventListener('abort',relay);throw e;}finally{clearTimeout(phase);}
}
