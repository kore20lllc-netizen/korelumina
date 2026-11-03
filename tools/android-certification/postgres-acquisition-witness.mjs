// Dormant server-only adapter for the existing Slice 2 transaction port.
// Pool must be an independently authenticated dedicated PostgreSQL service login.
// No SDK import, connection URL, environment discovery, schema install or retry.
import assert from 'node:assert/strict';
import {sha256} from './contracts.mjs';
import {validateAuthoritySnapshot} from './supabase-acquisition-authority.mjs';
export class WitnessDatabaseError extends Error {
 constructor(code){super(code);this.name='WitnessDatabaseError';this.code=code;}
}
const rejectedCodes=new Set(['22023','23505','23503','23514','40001','40P01','42501']);
export function createPostgresAcquisitionWitness({pool,authorityId,workerSubject,now=Date.now,timeoutMs=10000}={}) {
 assert(pool&&typeof pool.connect==='function','Authenticated database pool unavailable');
 assert(typeof authorityId==='string'&&/^npm-artifact-acquisition:[a-z0-9][a-z0-9-]{0,63}$/.test(authorityId));
 assert(typeof workerSubject==='string'&&workerSubject.length>0&&workerSubject.length<=256);
 assert(Number.isSafeInteger(timeoutMs)&&timeoutMs>0&&timeoutMs<=10000);
 return Object.freeze({transaction:async(domain,trustId,operation)=>{
  assert.equal(`${domain}:${trustId}`,authorityId,'Wrong database authority');assert(typeof operation==='function');
  let client,active=false,began=false,wrote=false,committed=false,destroy=false,expired=false,timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;destroy=true;reject(new WitnessDatabaseError(wrote?'witness_commit_uncertain':'witness_database_unavailable'));},timeoutMs);});
  const query=async(text,values=[])=>{if(expired)throw new WitnessDatabaseError(wrote?'witness_commit_uncertain':'witness_database_unavailable');return Promise.race([client.query(text,values),deadline]);};
  const snapshot=result=>{assert.equal(result?.rows?.length,1,'Missing database confirmation');const value=result.rows[0].snapshot;validateAuthoritySnapshot(value,{domain,trustId},now());return value;};
  try{
   const connecting=Promise.resolve().then(()=>pool.connect()).then(connection=>{if(expired){connection.release(true);throw new WitnessDatabaseError('witness_database_unavailable');}return connection;});
   client=await Promise.race([connecting,deadline]);assert(typeof client.query==='function'&&typeof client.release==='function');
   await query('BEGIN');began=true;
   await query("SET LOCAL synchronous_commit = on");await query("SET LOCAL statement_timeout = '5s'");await query("SET LOCAL lock_timeout = '2s'");await query("SET LOCAL idle_in_transaction_session_timeout = '10s'");
   active=true;let prior=null,txId=null,next=null,inFlight=0,failed=false;
   const check=()=>assert(active&&!expired,'Closed witness transaction');
   const guarded=async task=>{check();inFlight++;try{return await task();}catch(error){failed=true;throw error;}finally{inFlight--;}};
   const transaction=Object.freeze({
    read:()=>guarded(async()=>{assert(!wrote,'Read must precede transition');prior=snapshot(await query('SELECT klm_acquisition_witness.read_snapshot($1) AS snapshot',[authorityId]));return structuredClone(prior);}),
    compareAndSwapAndAppendAudit:input=>guarded(async()=>{
     check();assert(prior&&!wrote,'One transition per locked transaction');assert.equal(input.actor,workerSubject,'Verified worker identity mismatch');assert.equal(input.operation,'advance');
     const p=prior.state,e=input.entry;assert.equal(input.expectedHead,p.head);assert.equal(input.expectedAuditSequence,p.auditSequence);assert.equal(input.expectedAuditSha256,p.auditSha256);
     assert.equal(e.previous,p.head);assert(e.state.generation>p.generation,'Stale generation');assert.equal(sha256(JSON.stringify(e)),input.nextHead,'Conflicting witness digest');
     const audit={domain,trustId,sequence:p.auditSequence+1,generation:e.state.generation,head:input.nextHead,previousHead:p.head,previousAuditSha256:p.auditSha256,configurationSha256:e.state.configurationSha256,rootSpkiSha256:e.state.rootSpkiSha256,actor:workerSubject,operation:'advance'};
     txId=sha256(`klm-acquisition-transition:v1\n${authorityId}\n${input.nextHead}`);wrote=true;
     next=snapshot(await query('SELECT klm_acquisition_witness.compare_and_swap($1,$2,$3,$4,$5,$6,$7,$8) AS snapshot',[authorityId,p.generation,p.head,p.auditSequence,p.auditSha256,JSON.stringify(e),JSON.stringify(audit),txId]));
     assert.equal(next.state.head,input.nextHead);assert.deepEqual(next.audit,audit);for(const [key,value] of Object.entries(e.state))assert.deepEqual(next.state[key],value);
     return structuredClone(next);
    })
   });
   const result=await Promise.race([Promise.resolve().then(()=>operation(transaction)),deadline]);active=false;assert(inFlight===0&&!failed,'Incomplete or failed witness operation');
   // A backend transaction may resolve only after COMMIT acknowledgement and,
   // for writes, a new read of the immutable transaction record on this connection.
   const acknowledgement=await query('COMMIT');assert.equal(acknowledgement?.command,'COMMIT','Commit not acknowledged');committed=true;began=false;
   if(wrote){const confirmed=snapshot(await query('SELECT klm_acquisition_witness.confirm_transition($1,$2) AS snapshot',[authorityId,txId]));assert.deepEqual(confirmed.state,next.state);assert.deepEqual(confirmed.audit,next.audit);}
   return result;
  }catch(error){
   active=false;let rolledBack=false;
   if(client&&began&&!expired){try{await query('ROLLBACK');rolledBack=true;}catch{destroy=true;}}
   if(error instanceof WitnessDatabaseError)throw error;
   if(wrote&&(committed||!rolledBack||!rejectedCodes.has(error.code)))throw new WitnessDatabaseError('witness_commit_uncertain');
   throw new WitnessDatabaseError(client?'witness_transition_rejected':'witness_database_unavailable');
  }finally{
   active=false;clearTimeout(timer);
   try{client?.release(destroy||expired);}catch{throw new WitnessDatabaseError(wrote?'witness_commit_uncertain':'witness_database_unavailable');}
  }
 }});
}
