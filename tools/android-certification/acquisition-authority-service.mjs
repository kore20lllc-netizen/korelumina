// Service-side policy core, NOT a deployed endpoint or database implementation.
// Install only behind a verified identity boundary and a qualified transactional DB.
import assert from 'node:assert/strict';
import {sha256} from './contracts.mjs';
import {loadAcquisitionTrust} from './acquisition-trust.mjs';
import {validateAuthoritySnapshot,verifyAcquisitionCheckpoint,validateAcquisitionTransition} from './supabase-acquisition-authority.mjs';
const DOMAIN='npm-artifact-acquisition';
/** identityVerifier follows Runtime's verify(token)->{ok,identity:{userId,expiresAt}}
 * contract. A worker OIDC verifier must additionally qualify issuer/audience/repo/
 * workflow/environment/approval; Runtime user or local-header auth is insufficient.
 * database.transaction MUST isolate read/CAS/append and roll back on throw. Its
 * resolved result MUST follow durable commit; no worker may access this DB port.
 */
export function createAcquisitionAuthorityService({identityVerifier,subjects,protectedSource,checkpointSource,database,checkpointPublicKeyPem,checkpointSpkiSha256,now=Date.now}={}) {
 assert(identityVerifier&&typeof identityVerifier.verify==='function','Verified service identity unavailable');
 const identities={...subjects};assert.deepEqual(Object.keys(identities).sort(),['checkpoint','curator','recovery','worker']);
 const values=Object.values(identities);assert(values.every(v=>typeof v==='string'&&v.length>0)&&new Set(values).size===4,'Separate authority identities required');
 assert(protectedSource&&typeof protectedSource.readProtected==='function'&&checkpointSource&&typeof checkpointSource.read==='function'&&database&&typeof database.transaction==='function','Independent service infrastructure unavailable');
 return async function handle({authorization,body},{signal}={}) {
  assert(typeof authorization==='string'&&/^Bearer [^\s]+$/.test(authorization),'Missing service authentication');
  const verified=await identityVerifier.verify(authorization.slice(7));const actor=verified?.identity;
  assert(verified?.ok===true&&actor?.userId===identities.worker&&Number.isSafeInteger(actor.expiresAt)&&now()<actor.expiresAt,'Service operation unauthorized');
  assert(body&&['read','compareAndSwap'].includes(body.operation),'Worker mutation/recovery prohibited');
  const names=body.operation==='read'?['operation','domain','trustId']:['operation','domain','trustId','expectedHead','nextHead','entry'];
  assert.deepEqual(Object.keys(body).sort(),names.sort(),'Unexpected service operation fields');assert.equal(body.domain,DOMAIN);
  const bundle=await protectedSource.readProtected(DOMAIN,{signal});assert.equal(bundle.domain,DOMAIN);assert.equal(bundle.pin.trustId,body.trustId);
  assert(Number.isSafeInteger(bundle.observedAt)&&bundle.observedAt<=now()&&now()-bundle.observedAt<=60000,'Stale protected service configuration');
  assert.equal(bundle.sourceRevision,sha256(bundle.bytes));const trust=loadAcquisitionTrust(bundle.bytes,bundle.pin,{now:now()});
  assert.notEqual(checkpointSpkiSha256,trust.rootSpkiSha256,'Independent checkpoint key required');
  const checkpoint=await checkpointSource.read(DOMAIN,body.trustId,{signal});
  const checkAuthorization=()=>{assert(!signal?.aborted&&now()<actor.expiresAt,'Commit authorization expired/cancelled');assert(now()-bundle.observedAt<=60000&&now()<trust.notAfter,'Stale commit authorization');};
  const result=await database.transaction(DOMAIN,body.trustId,async transaction=>{
   checkAuthorization();
   const prior=await transaction.read();const state=validateAuthoritySnapshot(prior,body,now());
   verifyAcquisitionCheckpoint(checkpoint,checkpointPublicKeyPem,checkpointSpkiSha256,state,now());
   assert.equal(state.environment,trust.environment);assert(state.generation<=trust.generation,'Stale service generation');
   if(state.generation===trust.generation){assert.equal(state.configurationSha256,trust.configurationSha256);assert.equal(state.rootSpkiSha256,trust.rootSpkiSha256);}
   checkAuthorization();if(body.operation==='read')return prior;
   validateAcquisitionTransition(body.entry,body.expectedHead,body.nextHead,state,trust,bundle.sourceRevision);
   // Backend operation must atomically check expected head/version AND append audit.
   // Never implement this as separate REST UPDATE and INSERT calls.
   const committed=await transaction.compareAndSwapAndAppendAudit({expectedHead:state.head,expectedAuditSequence:state.auditSequence,expectedAuditSha256:state.auditSha256,entry:body.entry,nextHead:body.nextHead,actor:actor.userId,operation:'advance'});
   const next=validateAuthoritySnapshot(committed,body,now());assert.equal(next.head,body.nextHead);assert.equal(next.generation,trust.generation);
   assert.equal(next.auditSequence,state.auditSequence+1);assert.equal(committed.audit.previousHead,state.head);assert.equal(committed.audit.previousAuditSha256,state.auditSha256);
   assert.equal(committed.audit.actor,actor.userId);assert.equal(committed.audit.operation,'advance');
   for(const [name,value] of Object.entries(body.entry.state))assert.deepEqual(next[name],value);
   checkAuthorization();verifyAcquisitionCheckpoint(checkpoint,checkpointPublicKeyPem,checkpointSpkiSha256,state,now());return committed;
  });
  checkAuthorization();return result;
 };
}
