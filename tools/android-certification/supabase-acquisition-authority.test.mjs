import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {compileFunction} from 'node:vm';
import {createPublicKey,createPrivateKey,verify,sign,createHmac,timingSafeEqual} from 'node:crypto';
import {sha256} from './contracts.mjs';
import {loadAcquisitionTrust,requireProductionAcquisitionTrust} from './acquisition-trust.mjs';
import {createAcquisitionProvider,validateAuthoritySnapshot,verifyAcquisitionCheckpoint} from './supabase-acquisition-authority.mjs';
import {createAcquisitionAuthorityService} from './acquisition-authority-service.mjs';
import {acquireNpmArtifacts} from './acquire-npm-artifacts.mjs';
import {bootstrapAcquisitionTrust} from './acquisition-bootstrap.mjs';
// RFC 8032 public test vectors, not generated or provisioned production keys.
const vector=seed=>createPrivateKey({key:Buffer.from('302e020100300506032b657004220420'+seed,'hex'),format:'der',type:'pkcs8'});
const trustKey=vector('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60');
const checkpointKey=vector('4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb');
const publicPem=key=>createPublicKey(key).export({format:'pem',type:'spki'});
const fingerprint=key=>sha256(createPublicKey(key).export({format:'der',type:'spki'}));
const DOMAIN='npm-artifact-acquisition',clone=value=>JSON.parse(JSON.stringify(value));
const text=fs.readFileSync(new URL('./supabase-acquisition-authority.mjs',import.meta.url),'utf8');
const {createProvider,requestJson}=compileFunction(text.replace(/^import .*;$/gm,'').replace(/export /g,'')+'\nreturn {createProvider,requestJson};',['assert','https','createPublicKey','verify','sha256','loadAcquisitionTrust','requireProductionAcquisitionTrust'])(assert,https,createPublicKey,verify,sha256,loadAcquisitionTrust,requireProductionAcquisitionTrust);
const bootstrapText=fs.readFileSync(new URL('./acquisition-bootstrap.mjs',import.meta.url),'utf8');
const {bootstrapWithAdapters}=compileFunction(bootstrapText.replace(/^import .*;$/gm,'').replace(/export /g,'')+'\nreturn {bootstrapWithAdapters};',['fs','path','assert','createHmac','timingSafeEqual','sha256','loadAcquisitionTrust','requireProductionAcquisitionTrust'])(fs,path,assert,createHmac,timingSafeEqual,sha256,loadAcquisitionTrust,requireProductionAcquisitionTrust);
function fixture(){
 let clock=1800000000000;
 const trust=generation=>({schemaVersion:'klm-npm-acquisition-trust:v1',purpose:DOMAIN,environment:'production',trustId:'unit-acquisition',generation,publicKeyPem:publicPem(trustKey),notBefore:clock-1000,notAfter:clock+3600000});
 let approved=trust(2),bytes=Buffer.from(JSON.stringify(approved));
 const pin=()=>({trustId:approved.trustId,generation:approved.generation,configurationSha256:sha256(bytes),rootSpkiSha256:fingerprint(trustKey)});
 const state=t=>({domain:DOMAIN,trustId:t.trustId,environment:t.environment,generation:t.generation,configurationSha256:sha256(Buffer.from(JSON.stringify(t))),rootSpkiSha256:fingerprint(trustKey),notBefore:t.notBefore,notAfter:t.notAfter});
 const makeSnapshot=(s,head,sequence,previousHead=null,previousAuditSha256=null,actor='worker-subject')=>{
  const audit={domain:DOMAIN,trustId:s.trustId,sequence,generation:s.generation,head,previousHead,previousAuditSha256,configurationSha256:s.configurationSha256,rootSpkiSha256:s.rootSpkiSha256,actor,operation:'advance'};
  return {state:{...s,initialized:true,head,auditSequence:sequence,auditSha256:sha256(JSON.stringify(audit))},audit,observedAt:clock};
 };
 let databaseSnapshot=makeSnapshot(state(trust(1)),'a'.repeat(64),1),checkpointState=clone(databaseSnapshot.state);
 const original=clone(databaseSnapshot);let checkpointPatch={},snapshotPatch=null,commitPatch=null,autoFinalize=true;
 const envelope=()=>{const payload=JSON.stringify({schemaVersion:'klm-acquisition-checkpoint:v1',...checkpointState,issuedAt:clock-1,expiresAt:clock+59999,...checkpointPatch});return {payload,signature:sign(null,Buffer.from(payload),checkpointKey).toString('base64')};};
 const bundle=()=>({domain:DOMAIN,bytes:Buffer.from(bytes),pin:pin(),sourceRevision:sha256(bytes),observedAt:clock,historyRequired:true,initializeAuthorized:false});
 let tail=Promise.resolve(),commits=0,verifiedCalls=0;const requests=[];
 const database={transaction:async(_domain,_trustId,operation)=>{
  let release;const previous=tail;tail=new Promise(resolve=>{release=resolve;});await previous;
  let pending=clone(databaseSnapshot);try{
   const result=await operation({read:async()=>({...clone(pending),observedAt:clock}),compareAndSwapAndAppendAudit:async input=>{
    assert.equal(input.expectedHead,pending.state.head);assert.equal(input.expectedAuditSequence,pending.state.auditSequence);assert.equal(input.expectedAuditSha256,pending.state.auditSha256);
    pending=makeSnapshot(input.entry.state,input.nextHead,pending.state.auditSequence+1,pending.state.head,pending.state.auditSha256,input.actor);
    if(commitPatch)pending=commitPatch(pending);return clone(pending);
   }});
   if(pending.state.head!==databaseSnapshot.state.head){commits++;databaseSnapshot=clone(pending);if(autoFinalize)checkpointState=clone(pending.state);}return result;
  }finally{release();}
 }};
 const identities={'worker-token':'worker-subject','curator-token':'curator-subject','recovery-token':'recovery-subject','checkpoint-token':'checkpoint-subject'};
 const serviceOptions={identityVerifier:{verify:async token=>{verifiedCalls++;return identities[token]?{ok:true,identity:{userId:identities[token],expiresAt:clock+60000}}:{ok:false};}},subjects:{worker:'worker-subject',curator:'curator-subject',recovery:'recovery-subject',checkpoint:'checkpoint-subject'},protectedSource:{readProtected:async()=>bundle()},checkpointSource:{read:async()=>envelope()},database,checkpointPublicKeyPem:publicPem(checkpointKey),checkpointSpkiSha256:fingerprint(checkpointKey),now:()=>clock};
 const service=createAcquisitionAuthorityService(serviceOptions);
 const config={projectRef:'abcdefghijklmnopqrst',protectedUrl:'https://api.github.com/repos/kore20lllc-netizen/korelumina/contents/trust/acquisition.json?ref=protected-trust',checkpointUrl:'https://api.github.com/repos/kore20lllc-netizen/korelumina/contents/trust/checkpoint.json?ref=protected-checkpoints',trustPin:pin(),checkpointPublicKeyPem:publicPem(checkpointKey),checkpointSpkiSha256:fingerprint(checkpointKey),credentials:{github:async()=> 'github-read-token',authority:async()=> 'worker-token'}};
 const transport=async(url,request)=>{
  requests.push({url,method:request.method,body:request.body,authorization:request.headers.Authorization});
  assert.equal(request.headers.Authorization,url.startsWith('https://api.github.com/')?'Bearer github-read-token':'Bearer worker-token');
  if(url===config.protectedUrl)return {encoding:'base64',content:bytes.toString('base64')};
  if(url===config.checkpointUrl)return {encoding:'base64',content:Buffer.from(JSON.stringify(envelope())).toString('base64')};
  assert.equal(url,`https://${config.projectRef}.supabase.co/functions/v1/acquisition-authority`);
  let response=await service({authorization:request.headers.Authorization,body:JSON.parse(request.body)},{signal:request.signal});if(snapshotPatch)response=snapshotPatch(response);return response;
 };
 const provider=(patch={},send=transport,options={})=>createProvider({...config,...patch},send,{now:()=>clock,...options});
 const entry=()=>({schemaVersion:'klm-acquisition-rotation:v1',sequence:1,previous:databaseSnapshot.state.head,state:state(approved),sourceRevision:sha256(bytes),authentication:'b'.repeat(64)});
 const transition=async(p=provider())=>{const e=entry();return p.witness.compareAndSwap(DOMAIN,approved.trustId,e.previous,sha256(JSON.stringify(e)),{entry:e});};
 return {config,service,serviceOptions,provider,transport,bundle,entry,transition,envelope,original,requests,now:()=>clock,setClock:value=>{clock=value;},commits:()=>commits,verifiedCalls:()=>verifiedCalls,snapshot:()=>clone(databaseSnapshot),setSnapshot:s=>{databaseSnapshot=clone(s);},setCheckpoint:s=>{checkpointState=clone(s);},setCheckpointPatch:p=>{checkpointPatch=p;},setSnapshotPatch:p=>{snapshotPatch=p;},setCommitPatch:p=>{commitPatch=p;},setAutoFinalize:v=>{autoFinalize=v;},setApproved:t=>{approved=t;bytes=Buffer.from(JSON.stringify(t));},approved:()=>clone(approved)};
}
const read=p=>p.witness.read(DOMAIN,'unit-acquisition');
test('Slice 2 missing provider configuration fails closed',()=>assert.throws(()=>createAcquisitionProvider(),/configuration unavailable/));
test('Slice 2 missing authenticated service credentials rejects construction',()=>{const f=fixture();assert.throws(()=>f.provider({credentials:{}}),/credentials required/);});
test('Slice 2 service verifies identity independently of client',async()=>{const f=fixture();await assert.rejects(()=>f.service({authorization:'Bearer forged-token',body:{operation:'read',domain:DOMAIN,trustId:'unit-acquisition'}}),/unauthorized/);assert.equal(f.verifiedCalls(),1);assert.equal(f.commits(),0);});
for(const [token,operation] of [['worker-token','publishTrust'],['worker-token','recover'],['worker-token','reset'],['forged-token','publishTrust'],['forged-token','recover'],['curator-token','publishTrust'],['recovery-token','recover'],['checkpoint-token','compareAndSwap']]){
 test(`Slice 2 service rejects ${token} ${operation} directly`,async()=>{const f=fixture();await assert.rejects(()=>f.service({authorization:`Bearer ${token}`,body:{operation,domain:DOMAIN,trustId:'unit-acquisition'}}),/unauthorized|prohibited/);assert.equal(f.commits(),0);});
}
test('Slice 2 roles cannot share an identity',()=>{const f=fixture();assert.throws(()=>createAcquisitionAuthorityService({...f.serviceOptions,subjects:{...f.serviceOptions.subjects,recovery:'worker-subject'}}),/Separate authority/);});
test('Slice 2 unsigned role claims cannot authorize a service operation',async()=>{const f=fixture();await assert.rejects(()=>f.service({authorization:'Bearer forged-token',body:{operation:'read',role:'worker',userId:'worker-subject'}}),/unauthorized/);});
test('Slice 2 missing service database fails closed',()=>{const f=fixture();assert.throws(()=>createAcquisitionAuthorityService({...f.serviceOptions,database:null}),/infrastructure unavailable/);});
test('Slice 2 approved trust comes from GitHub and independent installed pin',async()=>{const f=fixture(),p=f.provider();const b=await p.source.readProtected(DOMAIN);assert.equal(b.sourceRevision,sha256(b.bytes));assert.equal(b.initializeAuthorized,false);assert.equal(b.historyRequired,true);assert.deepEqual(f.requests.map(r=>r.method),['GET']);});
test('Slice 2 substituted protected trust pin fails closed',async()=>{const f=fixture();await assert.rejects(()=>f.provider({trustPin:{...f.config.trustPin,configurationSha256:'0'.repeat(64)}}).source.readProtected(DOMAIN),/substituted/);assert.equal(f.commits(),0);});
test('Slice 2 fixed endpoints reject arbitrary authority or GitHub destinations',()=>{const f=fixture();for(const patch of [{projectRef:'evil.example'},{protectedUrl:'https://attacker.invalid/trust'},{checkpointUrl:f.config.protectedUrl},{protectedUrl:f.config.protectedUrl+'&evil=true'}])assert.throws(()=>f.provider(patch));});
test('Slice 2 invalid checkpoint provider key identity rejects',async()=>{const f=fixture();await assert.rejects(()=>read(f.provider({checkpointSpkiSha256:'0'.repeat(64)})),/Contradictory/);});
test('Slice 2 checkpoint signing identity cannot be acquisition root',()=>{const f=fixture();assert.throws(()=>f.provider({checkpointSpkiSha256:f.config.trustPin.rootSpkiSha256}),/separate/);});
test('Slice 2 reads require valid independent checkpoint and audit on every restart',async()=>{const f=fixture();assert.equal((await read(f.provider())).generation,1);assert.equal((await read(f.provider())).head,f.original.state.head);assert.equal(f.requests.filter(r=>r.url===f.config.checkpointUrl).length,2);});
test('Slice 2 accepted CAS includes durable audit and finalized independent checkpoint',async()=>{const f=fixture();assert.equal(await f.transition(),true);const s=f.snapshot();assert.equal(s.state.generation,2);assert.equal(s.audit.actor,'worker-subject');assert.equal(s.state.auditSequence,2);assert.equal(f.commits(),1);assert.equal((await read(f.provider())).head,s.state.head);});
test('Slice 2 stale generation is rejected by service before database write',async()=>{const f=fixture();await f.transition();await assert.rejects(()=>f.transition(),/Stale\/conflicting/);assert.equal(f.commits(),1);});
test('Slice 2 same-generation substitution is rejected by independent service',async()=>{const f=fixture();f.setApproved({...f.approved(),generation:1,notAfter:f.approved().notAfter+1});await assert.rejects(()=>f.service({authorization:'Bearer worker-token',body:{operation:'read',domain:DOMAIN,trustId:'unit-acquisition'}}),/AssertionError/);});
test('Slice 2 concurrent conflicting CAS has one service-side winner',async()=>{const f=fixture(),a=f.entry(),b={...a,authentication:'c'.repeat(64)};const submit=entry=>f.service({authorization:'Bearer worker-token',body:{operation:'compareAndSwap',domain:DOMAIN,trustId:'unit-acquisition',expectedHead:entry.previous,nextHead:sha256(JSON.stringify(entry)),entry}});
 const results=await Promise.allSettled([submit(a),submit(b)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);assert.equal(f.commits(),1);
});
test('Slice 2 missing audit confirmation cannot acknowledge a commit',async()=>{const f=fixture();f.setSnapshotPatch(s=>({...s,audit:null}));await assert.rejects(()=>read(f.provider()),/Missing authority evidence/);});
test('Slice 2 database transaction rolls back missing audit before commit',async()=>{const f=fixture();f.setCommitPatch(s=>({...s,audit:null}));await assert.rejects(()=>f.transition(),/Missing authority evidence/);assert.equal(f.commits(),0);assert.deepEqual(f.snapshot(),f.original);});
test('Slice 2 audit tampering rejects despite head equality',async()=>{const f=fixture();f.setSnapshotPatch(s=>({...s,audit:{...s.audit,actor:'attacker'}}));await assert.rejects(()=>read(f.provider()),/Contradictory/);});
test('Slice 2 invalid independent checkpoint signature rejects',()=>{const f=fixture(),e=f.envelope();e.signature=Buffer.alloc(64).toString('base64');assert.throws(()=>verifyAcquisitionCheckpoint(e,f.config.checkpointPublicKeyPem,f.config.checkpointSpkiSha256,f.original.state,f.now()),/signature/);});
test('Slice 2 stale independent checkpoint rejects',async()=>{const f=fixture();f.setCheckpointPatch({issuedAt:f.now()-60001,expiresAt:f.now()-1});await assert.rejects(()=>read(f.provider()),/Stale authority evidence/);});
test('Slice 2 contradictory checkpoint rejects both provider and service',async()=>{const f=fixture();f.setCheckpointPatch({head:'f'.repeat(64)});await assert.rejects(()=>read(f.provider()),/Contradictory/);assert.equal(f.commits(),0);});
test('Slice 2 database restoration cannot match independently retained checkpoint',async()=>{const f=fixture();await f.transition();const head=f.snapshot().state.head;f.setSnapshot(f.original);await assert.rejects(()=>read(f.provider()),/Contradictory/);assert.notEqual(f.snapshot().state.head,head);});
test('Slice 2 checkpoint lag after database commit is uncertain, never success',async()=>{const f=fixture();f.setAutoFinalize(false);await assert.rejects(()=>f.transition(),/Contradictory/);assert.equal(f.commits(),1);await assert.rejects(()=>read(f.provider()),/Contradictory/);});
test('Slice 2 stale witness response is rejected',()=>{const f=fixture(),s=f.snapshot();s.observedAt=f.now()-60001;assert.throws(()=>validateAuthoritySnapshot(s,{domain:DOMAIN,trustId:'unit-acquisition'},f.now()),/Stale witness/);});
test('Slice 2 provider timeout cancels unresponsive service without fallback',async()=>{const f=fixture();let attempts=0;const p=f.provider({},async()=>{attempts++;return new Promise(()=>{});},{timeoutMs:20});await assert.rejects(()=>read(p),/Provider timeout/);assert.equal(attempts,1);assert.equal(f.commits(),0);});
test('Slice 2 missing credential retrieval is bounded too',async()=>{const f=fixture();const p=f.provider({credentials:{...f.config.credentials,github:()=>new Promise(()=>{})}},f.transport,{timeoutMs:20});await assert.rejects(()=>read(p),/timeout/);assert.equal(f.requests.length,0);});
test('Slice 2 ambiguous committed response is never acknowledged or retried',async()=>{const f=fixture();let writes=0;const p=f.provider({},async(url,request)=>{const response=await f.transport(url,request);if(request.body&&JSON.parse(request.body).operation==='compareAndSwap'){writes++;throw Error('Synthetic connection lost after commit');}return response;});await assert.rejects(()=>f.transition(p),/connection lost/);assert.equal(writes,1);assert.equal(f.commits(),1);});
test('Slice 2 malformed post-commit response cannot authorize success',async()=>{const f=fixture();const p=f.provider({},async(url,r)=>{const result=await f.transport(url,r);return r.body&&JSON.parse(r.body).operation==='compareAndSwap'?true:result;});await assert.rejects(()=>f.transition(p));assert.equal(f.commits(),1);});
test('Slice 2 no privileged key or absent service identity is sent',async()=>{const f=fixture();for(const token of ['', 'sb_secret_synthetic', 'sb_publishable_synthetic','bad\ntoken']){const p=f.provider({credentials:{...f.config.credentials,authority:async()=>token}});await assert.rejects(()=>read(p));}assert.equal(f.commits(),0);});
test('Slice 2 pre-cancellation never calls provider transport',async()=>{const f=fixture(),controller=new AbortController();controller.abort();await assert.rejects(()=>f.provider().source.readProtected(DOMAIN,{signal:controller.signal}),/cancelled/);assert.equal(f.requests.length,0);});
test('Slice 2 acquisition stays disabled even with caller-supplied provider',async()=>{const f=fixture();await assert.rejects(()=>bootstrapAcquisitionTrust(),/authorization_unavailable/);await assert.rejects(()=>acquireNpmArtifacts({provider:f.provider()}),/authorization_unavailable/);assert.equal(f.requests.length,0);});
test('Slice 2 native execution and APK verification sources are unchanged',()=>{assert.equal(JSON.parse(fs.readFileSync(new URL('./toolchain.json',import.meta.url))).nativeExecutionEnabled,false);assert.match(bootstrapText,/const PROTECTED_BOOTSTRAP=null/);});

async function bootstrapFixture(operation){
 const f=fixture(),root=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'klm-s2-'));fs.chmodSync(root,0o700);const key=Buffer.alloc(32,8);
 const prior=f.original,state=Object.fromEntries(['domain','trustId','environment','generation','configurationSha256','rootSpkiSha256','notBefore','notAfter'].map(n=>[n,prior.state[n]]));
 const body={schemaVersion:'klm-acquisition-rotation:v1',sequence:0,previous:null,state,sourceRevision:state.configurationSha256};
 const entry={...body,authentication:createHmac('sha256',key).update(JSON.stringify(body)).digest('hex')};fs.writeFileSync(root+'/000000.json',JSON.stringify(entry),{mode:0o600});
 prior.state.head=sha256(JSON.stringify(entry));prior.audit.head=prior.state.head;prior.state.auditSha256=sha256(JSON.stringify(prior.audit));f.setSnapshot(prior);f.setCheckpoint(prior.state);
 const run=()=>bootstrapWithAdapters({...f.provider(),rotationRoot:root,rotationKey:key},{now:f.now()});
 try{await operation({...f,root,run});}finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('Slice 2 repository adapter and service core integrate with Slice 1 journal and restart',()=>bootstrapFixture(async f=>{
 const first=await f.run();assert.equal(first.anchor.generation,2);assert.equal(first.anchor.head,f.snapshot().state.head);assert.equal(f.commits(),1);
 const restart=await f.run();assert.deepEqual(restart.anchor,first.anchor);assert.equal(f.commits(),1);assert(!fs.existsSync(f.root+'/.rotation-uncertain'));
}));
test('Slice 2 checkpoint lag leaves durable uncertainty even after later finalization',()=>bootstrapFixture(async f=>{
 f.setAutoFinalize(false);await assert.rejects(()=>f.run(),/Contradictory/);assert.equal(f.commits(),1);assert(fs.existsSync(f.root+'/.rotation-uncertain'));
 f.setCheckpoint(f.snapshot().state);await assert.rejects(()=>f.run(),/explicit recovery/);assert(fs.existsSync(f.root+'/.rotation-uncertain'));
}));
// Exercise the native HTTPS wrapper using a synthetic request/response stream.
function nativeTransport(patch={}){
 const mock={request:(url,options,done)=>{
  assert.equal(new URL(url).protocol,'https:');assert.equal(options.rejectUnauthorized,true);assert.equal(options.agent,false);
  const request=new EventEmitter();request.end=()=>queueMicrotask(()=>{
   const response=new PassThrough();response.statusCode=patch.status??200;response.headers={'content-type':patch.contentType??'application/json'};
   done(response);if(patch.interrupted){response.emit('aborted');response.destroy();}else response.end(patch.bytes??Buffer.from('{"ok":true}'));
  });return request;
 }};
 const core=compileFunction(text.replace(/^import .*;$/gm,'').replace(/export /g,'')+'\nreturn {requestJson};',['assert','https','createPublicKey','verify','sha256','loadAcquisitionTrust','requireProductionAcquisitionTrust'])(assert,mock,createPublicKey,verify,sha256,loadAcquisitionTrust,requireProductionAcquisitionTrust);
 return ()=>core.requestJson('https://abcdefghijklmnopqrst.supabase.co/functions/v1/acquisition-authority',{method:'POST',headers:{},body:'{}',signal:new AbortController().signal});
}
test('Slice 2 HTTPS wrapper retains certificate verification and bounds valid JSON',async()=>assert.deepEqual(await nativeTransport()(),{ok:true}));
for(const status of [301,302,401,403,409,500])test('Slice 2 HTTPS rejects status '+status+' without redirect or retry',async()=>assert.rejects(nativeTransport({status}),/HTTP request rejected/));
test('Slice 2 HTTPS rejects non-JSON service evidence',async()=>assert.rejects(nativeTransport({contentType:'text/html'}),/content type/));
test('Slice 2 HTTPS rejects malformed JSON',async()=>assert.rejects(nativeTransport({bytes:Buffer.from('not-json')}),/Malformed authority/));
test('Slice 2 HTTPS rejects oversized evidence',async()=>assert.rejects(nativeTransport({bytes:Buffer.alloc(131073)}),/too large/));
test('Slice 2 HTTPS rejects interrupted response',async()=>assert.rejects(nativeTransport({interrupted:true}),/interrupted/));
