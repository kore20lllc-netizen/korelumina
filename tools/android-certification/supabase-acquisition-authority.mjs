// Dormant provider. Only independently reviewed deployment code may construct/install it.
// No environment discovery, production credentials, request-selected endpoints or fallback.
import assert from 'node:assert/strict';
import https from 'node:https';
import {createPublicKey,verify} from 'node:crypto';
import {sha256} from './contracts.mjs';
import {loadAcquisitionTrust,requireProductionAcquisitionTrust} from './acquisition-trust.mjs';
const DOMAIN='npm-artifact-acquisition';
const hash=value=>assert(typeof value==='string'&&/^[a-f0-9]{64}$/.test(value),'Invalid authority fingerprint');
const integer=value=>assert(Number.isSafeInteger(value)&&value>0,'Invalid authority sequence/generation');
const same=(a,b)=>assert.deepEqual(a,b,'Contradictory authority evidence');
const fields=(value,names)=>{assert(value&&typeof value==='object'&&!Array.isArray(value),'Missing authority evidence');same(Object.keys(value).sort(),[...names].sort());};
const stateFields=['domain','trustId','environment','generation','configurationSha256','rootSpkiSha256','notBefore','notAfter'];
const snapshotFields=[...stateFields,'initialized','head','auditSequence','auditSha256'];
function stateOf(trust){return Object.fromEntries(stateFields.map(key=>[key,key==='domain'?DOMAIN:trust[key]]));}
function fresh(issuedAt,expiresAt,now){assert(Number.isSafeInteger(issuedAt)&&Number.isSafeInteger(expiresAt)&&issuedAt<=now&&now<expiresAt&&expiresAt-issuedAt<=60000,'Stale authority evidence');}
export function validateAuthoritySnapshot(snapshot,{domain,trustId},now=Date.now()) {
 fields(snapshot,['state','audit','observedAt']);fields(snapshot.state,snapshotFields);
 const s=snapshot.state;assert.equal(domain,DOMAIN);same(s.domain,domain);same(s.trustId,trustId);assert.equal(s.initialized,true,'Uninitialized authority');
 assert(['production','synthetic'].includes(s.environment));integer(s.generation);integer(s.auditSequence);hash(s.head);hash(s.configurationSha256);hash(s.rootSpkiSha256);hash(s.auditSha256);
 assert(Number.isSafeInteger(s.notBefore)&&Number.isSafeInteger(s.notAfter)&&s.notBefore>0&&s.notBefore<s.notAfter,'Invalid activation interval');
 assert(Number.isSafeInteger(snapshot.observedAt)&&snapshot.observedAt<=now&&now-snapshot.observedAt<=60000,'Stale witness snapshot');
 const a=snapshot.audit;fields(a,['domain','trustId','sequence','generation','head','previousHead','previousAuditSha256','configurationSha256','rootSpkiSha256','actor','operation']);
 same(a.domain,domain);same(a.trustId,trustId);same(a.sequence,s.auditSequence);same(a.generation,s.generation);same(a.head,s.head);same(a.configurationSha256,s.configurationSha256);same(a.rootSpkiSha256,s.rootSpkiSha256);
 if(a.previousHead!==null)hash(a.previousHead);if(a.previousAuditSha256!==null)hash(a.previousAuditSha256);
 assert((s.auditSequence===1)===(a.previousHead===null&&a.previousAuditSha256===null),'Broken audit ancestry');
 if(s.auditSequence>1)assert(a.previousHead!==null&&a.previousAuditSha256!==null,'Missing audit ancestry');
 assert(typeof a.actor==='string'&&a.actor.length>0&&a.actor.length<=256);assert(['advance','recovery'].includes(a.operation));same(sha256(JSON.stringify(a)),s.auditSha256);
 return s;
}
/** Same raw-payload Ed25519 envelope primitive as contracts.mjs, separate purpose/key.
 * The key/pin are installed independently, never obtained from the database response. */
export function verifyAcquisitionCheckpoint(envelope,keyPem,keyFingerprint,expected,now=Date.now()) {
 fields(envelope,['payload','signature']);assert(typeof envelope.payload==='string'&&Buffer.byteLength(envelope.payload)<=16384);hash(keyFingerprint);
 const key=createPublicKey(keyPem);assert.equal(key.asymmetricKeyType,'ed25519');same(sha256(key.export({format:'der',type:'spki'})),keyFingerprint);
 assert(typeof envelope.signature==='string');const signature=Buffer.from(envelope.signature,'base64');assert.equal(signature.length,64);same(signature.toString('base64'),envelope.signature);
 assert(verify(null,Buffer.from(envelope.payload),key,signature),'Invalid independent checkpoint signature');
 const c=JSON.parse(envelope.payload);fields(c,['schemaVersion',...snapshotFields,'issuedAt','expiresAt']);same(c.schemaVersion,'klm-acquisition-checkpoint:v1');
 fresh(c.issuedAt,c.expiresAt,now);for(const name of snapshotFields)same(c[name],expected[name]);return c;
}
export function validateAcquisitionTransition(entry,expectedHead,nextHead,prior,trust,sourceRevision) {
 fields(entry,['schemaVersion','sequence','previous','state','sourceRevision','authentication']);same(entry.schemaVersion,'klm-acquisition-rotation:v1');
 assert(Number.isSafeInteger(entry.sequence)&&entry.sequence>=0&&entry.sequence<1000);hash(entry.authentication);hash(nextHead);hash(expectedHead);
 same(entry.previous,expectedHead);same(prior.head,expectedHead);same(sha256(JSON.stringify(entry)),nextHead);same(entry.sourceRevision,sourceRevision);
 same(entry.state,stateOf(trust));same(prior.domain,trust.domain??DOMAIN);same(prior.trustId,trust.trustId);same(prior.environment,trust.environment);
 assert(trust.generation>prior.generation&&trust.notBefore>=prior.notBefore,'Stale/conflicting generation');
}
function githubUrl(value) {
 const u=new URL(value);assert.equal(u.origin,'https://api.github.com');assert(!u.username&&!u.password&&!u.hash);
 assert(/^\/repos\/kore20lllc-netizen\/korelumina\/contents\/[A-Za-z0-9_./-]+$/.test(u.pathname));assert(!u.pathname.includes('/../'));
 assert(u.searchParams.get('ref')&&[...u.searchParams.keys()].length===1,'Protected GitHub revision required');return u.href;
}
function githubBytes(value){
 assert(value?.encoding==='base64'&&typeof value.content==='string'&&value.content.length<=65536,'Malformed protected GitHub content');
 const encoded=value.content.replace(/\n/g,'');const bytes=Buffer.from(encoded,'base64');same(bytes.toString('base64'),encoded);assert(bytes.length>0&&bytes.length<=32768);return bytes;
}
function requestJson(url,{method,headers,body,signal}) {
 return new Promise((resolve,reject)=>{
  const request=https.request(url,{method,headers,agent:false,rejectUnauthorized:true,signal},response=>{
   if(response.statusCode!==200){response.resume();reject(Error('Authority HTTP request rejected: '+response.statusCode));return;}
   if(!/^application\/json(?:;|$)/i.test(response.headers['content-type']??'')){response.resume();reject(Error('Invalid authority content type'));return;}
   let size=0;const chunks=[];
   response.on('data',chunk=>{size+=chunk.length;if(size>131072){response.destroy(Error('Authority response too large'));return;}chunks.push(chunk);});
   response.on('error',reject);response.on('aborted',()=>reject(Error('Authority response interrupted')));
   response.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{reject(Error('Malformed authority response'));}});
  });request.on('error',()=>reject(Error('Authority connection unavailable/uncertain')));request.end(body);
 });
}
export function createAcquisitionProvider(configuration) {return createProvider(configuration,requestJson);}
// Lexical synthetic transport injection only, following the existing certification tests.
function createProvider(configuration,transport,{mode='production',now=Date.now,timeoutMs=10000}={}) {
 assert(configuration,'Protected provider configuration unavailable');
 fields(configuration,['projectRef','protectedUrl','checkpointUrl','trustPin','checkpointPublicKeyPem','checkpointSpkiSha256','credentials']);
 const c={...configuration,trustPin:{...configuration.trustPin},credentials:{...configuration.credentials}};
 assert(typeof c.projectRef==='string'&&/^[a-z]{20}$/.test(c.projectRef));const authorityUrl=`https://${c.projectRef}.supabase.co/functions/v1/acquisition-authority`;
 const protectedUrl=githubUrl(c.protectedUrl),checkpointUrl=githubUrl(c.checkpointUrl);assert.notEqual(protectedUrl,checkpointUrl);
 assert(typeof c.credentials.github==='function'&&typeof c.credentials.authority==='function','Authenticated service credentials required');
 hash(c.checkpointSpkiSha256);assert.notEqual(c.checkpointSpkiSha256,c.trustPin.rootSpkiSha256,'Checkpoint authority must be separate from acquisition trust');
 assert(Number.isSafeInteger(timeoutMs)&&timeoutMs>0&&timeoutMs<=10000);
 const request=async(url,operation,body,signal)=>{
  const started=performance.now(),controller=new AbortController(),abort=()=>controller.abort(Error('Provider cancelled'));
  const check=()=>{if(performance.now()-started>=timeoutMs)controller.abort(Error('Provider timeout; commit may be uncertain'));if(controller.signal.aborted)throw controller.signal.reason;};signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  const timer=setTimeout(()=>controller.abort(Error('Provider timeout; commit may be uncertain')),timeoutMs);let onAbort;
  try{
   const cancelled=new Promise((_,reject)=>{onAbort=()=>reject(controller.signal.reason);controller.signal.addEventListener('abort',onAbort,{once:true});});
   const work=async()=>{check();const token=await c.credentials[operation]({signal:controller.signal});check();
    assert(typeof token==='string'&&token.length>0&&token.length<=16384&&!/[\s\r\n]/.test(token),'Missing service identity');
    assert(!/^sb_secret_|^sb_publishable_/.test(token),'Worker requires scoped service identity');
    const result=await transport(url,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,Accept:'application/json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'KoreLumina-acquisition-authority','Cache-Control':'no-cache'},body:body?JSON.stringify(body):undefined,signal:controller.signal});check();return result;};
   check();return await Promise.race([cancelled,work()]);
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);controller.signal.removeEventListener('abort',onAbort);controller.abort(Error('Provider operation ended'));}
 };
 const readProtected=async(domain,{signal}={})=>{
  same(domain,DOMAIN);const bytes=githubBytes(await request(protectedUrl,'github',null,signal));
  const trust=loadAcquisitionTrust(bytes,c.trustPin,{mode,now:now()});if(mode==='production')requireProductionAcquisitionTrust(trust,now());
  return {domain,bytes,pin:{...c.trustPin},sourceRevision:sha256(bytes),observedAt:now(),historyRequired:true,initializeAuthorized:false};
 };
 const checkpoint=async(state,signal)=>verifyAcquisitionCheckpoint(JSON.parse(githubBytes(await request(checkpointUrl,'github',null,signal))),c.checkpointPublicKeyPem,c.checkpointSpkiSha256,state,now());
 const readSnapshot=async(domain,trustId,signal)=>{
  const snapshot=await request(authorityUrl,'authority',{operation:'read',domain,trustId},signal);
  const state=validateAuthoritySnapshot(snapshot,{domain,trustId},now());await checkpoint(state,signal);validateAuthoritySnapshot(snapshot,{domain,trustId},now());return snapshot;
 };
 const read=async(domain,trustId,{signal}={})=>{
  const bundle=await readProtected(domain,{signal});same(bundle.pin.trustId,trustId);
  const snapshot=await readSnapshot(domain,trustId,signal);const s=snapshot.state;same(s.environment,mode);
  assert(s.generation<=bundle.pin.generation,'Stale protected generation');
  if(s.generation===bundle.pin.generation){same(s.configurationSha256,bundle.pin.configurationSha256);same(s.rootSpkiSha256,bundle.pin.rootSpkiSha256);}
  loadAcquisitionTrust(bundle.bytes,bundle.pin,{mode,now:now()});return {...s};
 };
 const compareAndSwap=async(domain,trustId,expectedHead,nextHead,{signal,entry}={})=>{
  const bundle=await readProtected(domain,{signal});same(bundle.pin.trustId,trustId);const trust=loadAcquisitionTrust(bundle.bytes,bundle.pin,{mode,now:now()});
  const prior=(await readSnapshot(domain,trustId,signal)).state;validateAcquisitionTransition(entry,expectedHead,nextHead,prior,trust,bundle.sourceRevision);
  loadAcquisitionTrust(bundle.bytes,bundle.pin,{mode,now:now()});
  const committed=await request(authorityUrl,'authority',{operation:'compareAndSwap',domain,trustId,expectedHead,nextHead,entry},signal);
  const state=validateAuthoritySnapshot(committed,{domain,trustId},now());same(state.head,nextHead);same(state.generation,trust.generation);same(state.auditSequence,prior.auditSequence+1);
  same(committed.audit.previousHead,prior.head);same(committed.audit.previousAuditSha256,prior.auditSha256);same(committed.audit.operation,'advance');
  same(stateOf(state),stateOf(trust));await checkpoint(state,signal);loadAcquisitionTrust(bundle.bytes,bundle.pin,{mode,now:now()});return true;
 };
 return Object.freeze({source:Object.freeze({readProtected}),witness:Object.freeze({read,compareAndSwap})});
}
