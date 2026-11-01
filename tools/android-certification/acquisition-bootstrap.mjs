// No protected acquisition provider/witness exists at this checkpoint.
// This is an adapter contract, not a deployed configuration service or new permit type.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {sha256} from './contracts.mjs';
import {loadAcquisitionTrust,requireProductionAcquisitionTrust} from './acquisition-trust.mjs';
const PROTECTED_BOOTSTRAP=null;
export async function bootstrapAcquisitionTrust(signal) {
 assert(PROTECTED_BOOTSTRAP,'acquisition_authorization_unavailable: protected bootstrap unavailable');
 return (await bootstrapWithAdapters(PROTECTED_BOOTSTRAP,{signal})).trust;
}
const DOMAIN='npm-artifact-acquisition';
const mac=(key,bytes)=>createHmac('sha256',key).update(bytes).digest('hex');
function privateRoot(root){
 assert(typeof root==='string'&&path.isAbsolute(root)&&path.resolve(root)===root&&fs.realpathSync(root)===root,'Unsafe rotation root');
 let p=path.parse(root).root;for(const part of root.slice(p.length).split('/')){p=path.join(p,part);assert(!fs.lstatSync(p).isSymbolicLink());}
 const stat=fs.statSync(root);assert(stat.isDirectory()&&!(stat.mode&0o077)&&(!process.getuid||stat.uid===process.getuid()),'Private rotation root required');
}
function read(file){const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const s=fs.fstatSync(fd);assert(s.isFile()&&s.size<=16384);return fs.readFileSync(fd);}finally{fs.closeSync(fd);}}
function sync(root){const fd=fs.openSync(root,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
/** Required external witness semantics: authenticated read, durable atomic CAS,
 * no caller reset/delete, independently retained head. A local file/self-asserted
 * protected:true flag is NOT a production implementation of this contract. */
async function anchorTrustGeneration({root,key,witness,trust,sourceRevision,historyRequired,initializeAuthorized},call,check) {
 privateRoot(root);assert(Buffer.isBuffer(key)&&key.length>=32);assert(witness&&typeof witness.read==='function'&&typeof witness.compareAndSwap==='function','Independent rotation witness unavailable');
 const owner=path.join(root,'.rotation-owner'),fd=fs.openSync(owner,'wx',0o600);
 try{
  const files=fs.readdirSync(root).filter(n=>n!=='.rotation-owner').sort();assert(files.length<=1000);
  assert(!files.includes('.rotation-uncertain'),'Rotation anchor commit uncertain; explicit recovery required');
  let prior=null,previous=null;
  for(const [i,name] of files.entries()){
   assert.equal(name,String(i).padStart(6,'0')+'.json','Missing/corrupt rotation history');const entry=JSON.parse(read(path.join(root,name)));
   const {authentication,...body}=entry;assert.equal(body.schemaVersion,'klm-acquisition-rotation:v1');assert.equal(body.sequence,i);assert.equal(body.previous,previous);
   assert(typeof authentication==='string'&&/^[a-f0-9]{64}$/.test(authentication));assert(timingSafeEqual(Buffer.from(authentication,'hex'),Buffer.from(mac(key,JSON.stringify(body)),'hex')),'Rotation evidence tampered');
   assert.equal(body.state.domain,DOMAIN);assert.equal(body.state.trustId,trust.trustId);assert.equal(body.state.environment,trust.environment);
   assert(Number.isSafeInteger(body.state.generation)&&body.state.generation>0);
   if(prior)assert(body.state.generation>prior.generation&&body.state.notBefore>=prior.notBefore,'Rotation history rollback');
   prior=body.state;previous=sha256(JSON.stringify(entry));
  }
  const remote=await call(signal=>witness.read(DOMAIN,trust.trustId,{signal}));
  assert(remote&&remote.domain===DOMAIN&&remote.trustId===trust.trustId&&typeof remote.initialized==='boolean','Malformed independent witness');
  if(prior){assert(remote.initialized&&remote.head===previous,'Independent rotation head mismatch');}
  else {assert(!historyRequired&&initializeAuthorized===true,'Prior rotation history required');assert(remote.initialized===false&&remote.head===null,'Deleted historical rotation state');}
  const next={domain:DOMAIN,trustId:trust.trustId,environment:trust.environment,generation:trust.generation,configurationSha256:trust.configurationSha256,rootSpkiSha256:trust.rootSpkiSha256,notBefore:trust.notBefore,notAfter:trust.notAfter};
  if(prior){
   assert(next.generation>=prior.generation,'Older trust generation rejected');
   if(next.generation===prior.generation){assert.deepEqual(next,prior,'Unauthorized same-generation substitution');return {generation:prior.generation,head:previous};}
   assert(next.notBefore>=prior.notBefore,'Trust activation rollback');
  }
  const body={schemaVersion:'klm-acquisition-rotation:v1',sequence:files.length,previous,state:next,sourceRevision};
  const entry={...body,authentication:mac(key,JSON.stringify(body))},data=Buffer.from(JSON.stringify(entry));
  check();
  const pending=path.join(root,'.rotation-pending'),out=fs.openSync(pending,'wx',0o600);
  try{fs.writeFileSync(out,data);fs.fsyncSync(out);}finally{fs.closeSync(out);}
  // Exclusive revision publication follows FileMobileBuildStore. No overwrite or reset.
  fs.linkSync(pending,path.join(root,String(files.length).padStart(6,'0')+'.json'));fs.unlinkSync(pending);sync(root);
  const head=sha256(JSON.stringify(entry));
  // Retain uncertainty even if a timed-out CAS later commits remotely. Only a
  // separately authorized recovery may reconcile this marker; workers cannot reset it.
  const uncertain=path.join(root,'.rotation-uncertain'),marker=fs.openSync(uncertain,'wx',0o600);
  try{fs.writeFileSync(marker,head);fs.fsyncSync(marker);}finally{fs.closeSync(marker);}sync(root);
  assert(await call(signal=>witness.compareAndSwap(DOMAIN,trust.trustId,previous,head,{signal,entry}))===true,'Rotation anchor commit uncertain; explicit recovery required');
  const confirmed=await call(signal=>witness.read(DOMAIN,trust.trustId,{signal}));assert(confirmed.initialized&&confirmed.head===head&&confirmed.domain===DOMAIN&&confirmed.trustId===trust.trustId,'Rotation witness confirmation failed');
  check();fs.unlinkSync(uncertain);sync(root);
  return {generation:next.generation,head};
 } finally {fs.closeSync(fd);fs.unlinkSync(owner);sync(root);}
}
/** Private bootstrap: only a future independently installed adapter can reach this
 * from production. Test adapter injection is lexical, never request-accessible. */
async function bootstrapWithAdapters({source,witness,rotationRoot,rotationKey}, {mode='production',now=Date.now(),signal,timeoutMs=60000}={}) {
 const started=performance.now();
 assert(source&&typeof source.readProtected==='function','Protected bootstrap unavailable');
 assert(Number.isSafeInteger(timeoutMs)&&timeoutMs>0&&timeoutMs<=60000,'Invalid bootstrap deadline');
 const controller=new AbortController();
 const abort=()=>controller.abort(Error('Bootstrap cancelled'));
 const check=()=>{if(performance.now()-started>=timeoutMs)controller.abort(Error('Bootstrap timeout'));if(controller.signal.aborted)throw controller.signal.reason;};
 signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 const timer=setTimeout(()=>controller.abort(Error('Bootstrap timeout')),timeoutMs);
 // Race bounds admission even when a provider ignores cancellation. A late remote
 // commit cannot be undone; durable uncertainty blocks subsequent worker admission.
 const call=async operation=>{
  check();let onAbort;
  try{
   const cancelled=new Promise((_,reject)=>{onAbort=()=>reject(controller.signal.reason);controller.signal.addEventListener('abort',onAbort,{once:true});});
   const result=await Promise.race([cancelled,Promise.resolve().then(()=>{check();return operation(controller.signal);})]);check();return result;
  }finally{controller.signal.removeEventListener('abort',onAbort);}
 };
 try {
 const bundle=await call(signal=>source.readProtected(DOMAIN,{signal}));
 assert(bundle&&bundle.domain===DOMAIN&&typeof bundle.sourceRevision==='string'&&/^[a-f0-9]{64}$/.test(bundle.sourceRevision),'Malformed protected bootstrap');
 const readAt=now+Math.ceil(performance.now()-started);
 assert(Number.isSafeInteger(bundle.observedAt)&&bundle.observedAt<=readAt&&readAt-bundle.observedAt<=60000,'Stale protected bootstrap');
 assert(typeof bundle.historyRequired==='boolean'&&typeof bundle.initializeAuthorized==='boolean');
 const trust=loadAcquisitionTrust(bundle.bytes,bundle.pin,{mode,now:readAt});
 if(mode==='production')requireProductionAcquisitionTrust(trust,readAt);
 const anchor=await anchorTrustGeneration({root:rotationRoot,key:rotationKey,witness,trust,sourceRevision:bundle.sourceRevision,historyRequired:bundle.historyRequired,initializeAuthorized:bundle.initializeAuthorized},call,check);
 const completedAt=now+Math.ceil(performance.now()-started);assert(completedAt-bundle.observedAt<=60000&&completedAt<trust.notAfter,'Configuration stale during bootstrap');
 check();return Object.freeze({trust,anchor:Object.freeze(anchor),sourceRevision:bundle.sourceRevision});
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);controller.abort(Error('Bootstrap ended'));}
}
