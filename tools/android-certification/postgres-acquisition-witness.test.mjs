import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createPrivateKey,createPublicKey,sign} from 'node:crypto';
import {createPostgresAcquisitionWitness} from './postgres-acquisition-witness.mjs';
import {createAcquisitionAuthorityService} from './acquisition-authority-service.mjs';
import {sha256} from './contracts.mjs';
import {acquireNpmArtifacts} from './acquire-npm-artifacts.mjs';
// Driver fixtures verify the adapter's protocol, NOT PostgreSQL SQL/lock/grant behavior.
const DOMAIN='npm-artifact-acquisition',trustId='unit-acquisition',authorityId=DOMAIN+':'+trustId;
const copy=value=>structuredClone(value),clock=1800000000000;
const state=generation=>({domain:DOMAIN,trustId,environment:'production',generation,configurationSha256:'a'.repeat(64),rootSpkiSha256:'b'.repeat(64),notBefore:clock-1000,notAfter:clock+3600000});
function snapshot(s,head,sequence,previousHead=null,previousAuditSha256=null){
 const audit={domain:DOMAIN,trustId,sequence,generation:s.generation,head,previousHead,previousAuditSha256,configurationSha256:s.configurationSha256,rootSpkiSha256:s.rootSpkiSha256,actor:'verified-worker',operation:'advance'};
 return {state:{...s,initialized:true,head,auditSequence:sequence,auditSha256:sha256(JSON.stringify(audit))},audit,observedAt:clock};
}
function fixture(patch={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'klm-s3-driver-')),file=root+'/synthetic-driver-state.json';fs.writeFileSync(file,JSON.stringify(snapshot(state(1),'c'.repeat(64),1)));
 const calls=[],releases=[];let pending,records=new Map(),client;
 const pool={connect:async()=>{
  client={release:destroy=>{releases.push(destroy);},query:async(text,values=[])=>{
   calls.push({text,values});if(patch.query){const override=await patch.query(text,values);if(override!==undefined)return override;}
   if(text==='BEGIN'){pending=JSON.parse(fs.readFileSync(file));return {rows:[]};}
   if(text.startsWith('SET LOCAL'))return {rows:[]};
   if(text==='ROLLBACK'){pending=null;return {rows:[]};}
   if(text==='COMMIT'){if(pending){fs.writeFileSync(file,JSON.stringify(pending));records.set(pending.state.head,copy(pending));}pending=null;if(patch.commitError)throw Error('synthetic lost commit response');return {command:'COMMIT',rows:[]};}
   if(text.includes('.read_snapshot('))return {rows:[{snapshot:copy(pending)}]};
   if(text.includes('.compare_and_swap(')){
    const entry=JSON.parse(values[5]),audit=JSON.parse(values[6]);pending={state:{...entry.state,initialized:true,head:audit.head,auditSequence:audit.sequence,auditSha256:sha256(values[6])},audit,observedAt:clock};
    if(patch.afterWrite)patch.afterWrite(pending);return {rows:[{snapshot:copy(pending)}]};
   }
   if(text.includes('.confirm_transition(')){if(patch.confirmError)throw Error('synthetic confirmation unavailable');return {rows:[{snapshot:JSON.parse(fs.readFileSync(file))}]};}
   throw Error('Unexpected fixture query');
  }};return client;
 }};
 const db=()=>createPostgresAcquisitionWitness({pool,authorityId,workerSubject:'verified-worker',now:()=>clock,...patch.options});
 const entry=()=>({schemaVersion:'klm-acquisition-rotation:v1',sequence:1,previous:JSON.parse(fs.readFileSync(file)).state.head,state:state(2),sourceRevision:'a'.repeat(64),authentication:'d'.repeat(64)});
 const advance=async(tx,amend={})=>{const p=await tx.read(),e=entry();return tx.compareAndSwapAndAppendAudit({expectedHead:p.state.head,expectedAuditSequence:p.state.auditSequence,expectedAuditSha256:p.state.auditSha256,entry:e,nextHead:sha256(JSON.stringify(e)),actor:'verified-worker',operation:'advance',...amend});};
 return {pool,db,advance,entry,calls,releases,stored:()=>JSON.parse(fs.readFileSync(file)),restore:value=>fs.writeFileSync(file,JSON.stringify(value)),cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
async function isolated(fn,patch){const f=fixture(patch);try{await fn(f);}finally{f.cleanup();}}
const code=expected=>error=>error.code===expected;
test('Slice 3 missing authenticated database pool fails closed',()=>assert.throws(()=>createPostgresAcquisitionWitness(),/pool unavailable/));
test('Slice 3 missing bound worker identity rejects',()=>assert.throws(()=>createPostgresAcquisitionWitness({pool:{connect(){}},authorityId})));
test('Slice 3 wrong authority cannot acquire a connection',()=>isolated(async f=>{await assert.rejects(()=>f.db().transaction(DOMAIN,'other',()=>{}));assert.equal(f.calls.length,0);}));
test('Slice 3 driver contract returns transition only after COMMIT and immutable confirmation',()=>isolated(async f=>{
 const result=await f.db().transaction(DOMAIN,trustId,f.advance);assert.equal(result.state.generation,2);
 const commands=f.calls.map(c=>c.text);assert(commands.indexOf('COMMIT')<commands.findIndex(t=>t.includes('.confirm_transition(')));assert(commands.some(t=>t.includes('synchronous_commit = on')));
 assert.equal(f.stored().state.generation,2);assert.deepEqual(f.releases,[false]);
}));
test('Slice 3 driver sends parameterized expected generation digest audit and transaction ID',()=>isolated(async f=>{
 await f.db().transaction(DOMAIN,trustId,f.advance);const write=f.calls.find(c=>c.text.includes('.compare_and_swap('));assert.equal(write.values[1],1);assert.equal(write.values[2],'c'.repeat(64));
 const entry=JSON.parse(write.values[5]);assert.equal(write.values[7],sha256(`klm-acquisition-transition:v1\n${authorityId}\n${sha256(JSON.stringify(entry))}`));assert.equal(write.values[6],JSON.stringify(f.stored().audit));
}));
test('Slice 3 stale driver generation rejects before write dispatch',()=>isolated(async f=>{await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,async tx=>{const prior=await tx.read();const e=f.entry();e.state.generation=1;return tx.compareAndSwapAndAppendAudit({expectedHead:prior.state.head,expectedAuditSequence:1,expectedAuditSha256:prior.state.auditSha256,entry:e,nextHead:sha256(JSON.stringify(e)),actor:'verified-worker',operation:'advance'});}),code('witness_transition_rejected'));assert.equal(f.stored().state.generation,1);}));
test('Slice 3 conflicting driver witness digest rejects',()=>isolated(async f=>{await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,tx=>f.advance(tx,{nextHead:'f'.repeat(64)})),code('witness_transition_rejected'));assert.equal(f.stored().state.generation,1);}));
test('Slice 3 caller actor label cannot impersonate bound worker',()=>isolated(async f=>{await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,tx=>f.advance(tx,{actor:'unverified-curator'})),code('witness_transition_rejected'));assert(!f.calls.some(c=>c.text.includes('.compare_and_swap(')));}));
test('Slice 3 callback rejection dispatches ROLLBACK without COMMIT',()=>isolated(async f=>{await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,async tx=>{await tx.read();throw Error('checkpoint rejected');}),code('witness_transition_rejected'));assert(f.calls.some(c=>c.text==='ROLLBACK'));assert(!f.calls.some(c=>c.text==='COMMIT'));}));
test('Slice 3 malformed audit response cannot cause COMMIT',()=>isolated(async f=>{await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,f.advance),code('witness_commit_uncertain'));assert(!f.calls.some(c=>c.text==='COMMIT'));assert.equal(f.stored().state.generation,1);},{afterWrite:s=>{s.audit.actor='tampered';}}));
test('Slice 3 SQL unique violation is a rejected outcome after rollback',()=>isolated(async f=>{await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,f.advance),code('witness_transition_rejected'));assert(f.calls.some(c=>c.text==='ROLLBACK'));},{query:text=>{if(text.includes('.compare_and_swap('))throw Object.assign(Error('synthetic duplicate'),{code:'23505'});}}));
test('Slice 3 commit connection loss is uncertain without automatic retry',()=>isolated(async f=>{await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,f.advance),code('witness_commit_uncertain'));assert.equal(f.calls.filter(c=>c.text==='COMMIT').length,1);},{commitError:true}));
test('Slice 3 missing durable readback is uncertain after COMMIT',()=>isolated(async f=>{await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,f.advance),code('witness_commit_uncertain'));assert.equal(f.stored().state.generation,2);},{confirmError:true}));
test('Slice 3 interrupted driver query destroys connection and fails closed',()=>isolated(async f=>{await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,f.advance),code('witness_commit_uncertain'));assert.deepEqual(f.releases,[true]);assert(!f.calls.some(c=>c.text==='COMMIT'));},{options:{timeoutMs:30},query:text=>text.includes('.compare_and_swap(')?new Promise(()=>{}):undefined}));
test('Slice 3 driver read after adapter restart re-verifies persisted fixture bytes',()=>isolated(async f=>{await f.db().transaction(DOMAIN,trustId,f.advance);const value=await f.db().transaction(DOMAIN,trustId,tx=>tx.read());assert.equal(value.state.generation,2);assert.equal(f.calls.filter(c=>c.text.includes('.read_snapshot(')).length,2);}));
test('Slice 3 transaction callbacks cannot retain access after completion',()=>isolated(async f=>{let saved;await f.db().transaction(DOMAIN,trustId,async tx=>{saved=tx;return tx.read();});await assert.rejects(()=>saved.read(),/Closed witness transaction/);}));
test('Slice 3 repeated transition calls in one transaction reject and roll back',()=>isolated(async f=>{await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,async tx=>{await f.advance(tx);await f.advance(tx);}),code('witness_commit_uncertain'));assert.equal(f.stored().state.generation,1);}));
// Source checks are intentionally not treated as database privilege certification.
test('Slice 3 SQL source is included and default-deny definitions have no runtime grants or role creation',()=>{
 const sql=fs.readFileSync(new URL('./acquisition-witness-schema.sql',import.meta.url),'utf8');assert.match(sql,/REVOKE ALL ON ALL FUNCTIONS/);assert.match(sql,/ENABLE ROW LEVEL SECURITY/);assert.doesNotMatch(sql,/^\s*(CREATE ROLE|GRANT\s)/mi);
 assert.match(sql,/database_login=session_user/);assert.match(sql,/FOR UPDATE/);assert.match(sql,/transaction_id text NOT NULL UNIQUE/);assert.match(sql,/history_no_truncate/);
});
// Reuse published RFC 8032 test vectors; never generate production identities/keys.
const privateVector=hex=>createPrivateKey({key:Buffer.from('302e020100300506032b657004220420'+hex,'hex'),format:'der',type:'pkcs8'});
const trustKey=privateVector('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60');
const checkpointKey=privateVector('4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb');
const publicPem=key=>createPublicKey(key).export({format:'pem',type:'spki'}),fingerprint=key=>sha256(createPublicKey(key).export({format:'der',type:'spki'}));
function service(f,patch={}){
 const config={schemaVersion:'klm-npm-acquisition-trust:v1',purpose:DOMAIN,environment:'production',trustId,generation:2,publicKeyPem:publicPem(trustKey),notBefore:clock-1000,notAfter:clock+3600000};const bytes=Buffer.from(JSON.stringify(config));
 const cp={schemaVersion:'klm-acquisition-checkpoint:v1',...f.stored().state,issuedAt:clock-1,expiresAt:clock+59999};
 const payload=JSON.stringify(cp),envelope={payload,signature:sign(null,Buffer.from(payload),checkpointKey).toString('base64')};
 return createAcquisitionAuthorityService({identityVerifier:{verify:async token=>token==='valid-worker'?{ok:true,identity:{userId:'verified-worker',expiresAt:clock+60000}}:{ok:false}},subjects:{worker:'verified-worker',curator:'verified-curator',recovery:'verified-recovery',checkpoint:'verified-checkpoint'},protectedSource:{readProtected:async()=>({domain:DOMAIN,bytes,pin:{configurationSha256:sha256(bytes),rootSpkiSha256:fingerprint(trustKey),trustId,generation:2},sourceRevision:sha256(bytes),observedAt:clock})},checkpointSource:{read:async()=>envelope},checkpointPublicKeyPem:publicPem(checkpointKey),checkpointSpkiSha256:fingerprint(checkpointKey),database:f.db(),now:()=>clock,...patch});
}
for(const authorization of [undefined,'Bearer fake-worker','Bearer fake-curator','Bearer fake-recovery','Bearer fake-checkpoint'])test('Slice 3 missing or unverified service identity rejected: '+authorization,()=>isolated(async f=>{await assert.rejects(()=>service(f)({authorization,body:{operation:'read',domain:DOMAIN,trustId}}),/authentication|unauthorized/);assert.equal(f.calls.length,0);}));
for(const operation of ['publishTrust','recover','reset'])test('Slice 3 verified worker cannot invoke '+operation,()=>isolated(async f=>{await assert.rejects(()=>service(f)({authorization:'Bearer valid-worker',body:{operation,domain:DOMAIN,trustId}}),/prohibited/);assert.equal(f.calls.length,0);}));
test('Slice 3 missing independent checkpoint rejects before database admission',()=>isolated(async f=>{await assert.rejects(()=>service(f,{checkpointSource:{read:async()=>{throw Error('checkpoint unavailable');}}})({authorization:'Bearer valid-worker',body:{operation:'read',domain:DOMAIN,trustId}}),/checkpoint unavailable/);assert.equal(f.calls.length,0);}));
test('Slice 3 restored fixture witness conflicts with independently signed newer checkpoint',()=>isolated(async f=>{const old=f.stored();await f.db().transaction(DOMAIN,trustId,f.advance);const handler=service(f);f.restore(old);await assert.rejects(()=>handler({authorization:'Bearer valid-worker',body:{operation:'read',domain:DOMAIN,trustId}}),code('witness_transition_rejected'));assert(f.calls.some(c=>c.text==='ROLLBACK'));}));
test('Slice 3 acquisition stays disabled',async()=>assert.rejects(()=>acquireNpmArtifacts(),/authorization_unavailable/));
test('Slice 3 native execution stays disabled',()=>assert.equal(JSON.parse(fs.readFileSync(new URL('./toolchain.json',import.meta.url))).nativeExecutionEnabled,false));
for(const behavior of ['initial witness creation','valid SQL generation transition','stale SQL generation exclusion','concurrent SQL CAS exclusion','duplicate SQL transaction identifiers','transaction rollback and interrupted connection atomicity','immutable audit committed atomically','database privilege and RLS enforcement','curator-only initialization and trust approval','restart/WAL persistence and durable confirmation']){
 test('UNVERIFIED PostgreSQL: '+behavior,{skip:'No isolated PostgreSQL engine; no SQL source or migrations executed. Driver fixtures are not database certification.'},()=>{});
}

test('Slice 3 late pool connection is discarded after deadline',async()=>{
 let resolve;const connection=new Promise(yes=>{resolve=yes;});const released=[];
 const db=createPostgresAcquisitionWitness({pool:{connect:()=>connection},authorityId,workerSubject:'verified-worker',timeoutMs:20});
 await assert.rejects(()=>db.transaction(DOMAIN,trustId,()=>{}),code('witness_database_unavailable'));
 resolve({release:destroy=>released.push(destroy)});await new Promise(yes=>setImmediate(yes));assert.deepEqual(released,[true]);
});
test('Slice 3 rollback failure after a dispatched write is uncertain and destroys connection',()=>isolated(async f=>{
 await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,async tx=>{await f.advance(tx);throw Error('synthetic interruption');}),code('witness_commit_uncertain'));assert.deepEqual(f.releases,[true]);
},{query:text=>{if(text==='ROLLBACK')throw Error('synthetic rollback unavailable');}}));

test('Slice 3 caught callback operation failure cannot lead to COMMIT',()=>isolated(async f=>{
 await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,async tx=>{try{await f.advance(tx,{actor:'forged'});}catch{}return {ok:true};}),code('witness_transition_rejected'));assert(!f.calls.some(c=>c.text==='COMMIT'));
}));
test('Slice 3 aborted COMMIT acknowledgement cannot report success',()=>isolated(async f=>{
 await assert.rejects(()=>f.db().transaction(DOMAIN,trustId,f.advance),code('witness_commit_uncertain'));
},{query:text=>text==='COMMIT'?{command:'ROLLBACK',rows:[]}:undefined}));
