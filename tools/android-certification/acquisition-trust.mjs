// Validation only: provisioning and protected bootstrap selection are separate authority.
import assert from 'node:assert/strict';
import {createPublicKey} from 'node:crypto';
import {sha256} from './contracts.mjs';
const records=new WeakMap();
const fingerprint=value=>assert(typeof value==='string'&&/^[a-f0-9]{64}$/.test(value),'Malformed trust fingerprint');
function keys(value,expected){assert(value&&typeof value==='object'&&!Array.isArray(value));assert.deepEqual(Object.keys(value).sort(),expected.sort(),'Malformed trust configuration');}
/** pin must come from independently reviewed protected bootstrap, never a request or
 * from hashing the same untrusted configuration and trusting that self-assertion. */
export function loadAcquisitionTrust(bytes,pin,{mode='production',previous=null,now=Date.now()}={}) {
 assert(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=16384,'Acquisition trust absent/malformed');
 assert(['production','synthetic'].includes(mode));
 keys(pin,['configurationSha256','rootSpkiSha256','trustId','generation']);fingerprint(pin.configurationSha256);fingerprint(pin.rootSpkiSha256);
 assert.equal(sha256(bytes),pin.configurationSha256,'Trust configuration substituted');
 const t=JSON.parse(bytes.toString('utf8'));
 keys(t,['schemaVersion','purpose','environment','trustId','generation','publicKeyPem','notBefore','notAfter']);
 assert.equal(t.schemaVersion,'klm-npm-acquisition-trust:v1');assert.equal(t.purpose,'npm-artifact-acquisition');
 assert.equal(t.environment,mode,'Synthetic trust rejected in production');
 assert(typeof t.trustId==='string'&&/^[a-z0-9][a-z0-9-]{0,63}$/.test(t.trustId));
 assert(Number.isSafeInteger(t.generation)&&t.generation>0);assert.equal(t.trustId,pin.trustId);assert.equal(t.generation,pin.generation);
 assert(Number.isSafeInteger(t.notBefore)&&Number.isSafeInteger(t.notAfter)&&t.notBefore>0&&t.notBefore<=now&&now<t.notAfter,'Inactive/expired trust');
 assert(typeof t.publicKeyPem==='string'&&t.publicKeyPem.length<4096&&/^-----BEGIN PUBLIC KEY-----\n[A-Za-z0-9+/=\n]+-----END PUBLIC KEY-----\n?$/.test(t.publicKeyPem),'Public-only trust required');
 const key=createPublicKey(t.publicKeyPem);assert.equal(key.asymmetricKeyType,'ed25519');
 const rootSpkiSha256=sha256(key.export({format:'der',type:'spki'}));assert.equal(rootSpkiSha256,pin.rootSpkiSha256,'Trust-root identity mismatch');
 if(previous){const old=records.get(previous);assert(old,'Unrecognized prior trust');assert.equal(old.trustId,t.trustId);assert.equal(old.environment,mode);assert(t.generation>old.generation&&t.notBefore>=old.notBefore,'Trust rotation rollback');}
 const record={trustId:t.trustId,generation:t.generation,environment:mode,configurationSha256:pin.configurationSha256,rootSpkiSha256,notBefore:t.notBefore,notAfter:t.notAfter};
 const receipt=Object.freeze({...record});records.set(receipt,Object.freeze({...record,key}));return receipt;
}
function record(trust){const value=records.get(trust);assert(value,'Untrusted request-supplied trust');return value;}
export function requireProductionAcquisitionTrust(trust,now=Date.now()) {const t=record(trust);assert.equal(t.environment,'production','Synthetic trust cannot authorize production');assert(t.notBefore<=now&&now<t.notAfter,'Inactive/expired trust');}
export function acquisitionPublicKey(trust){return record(trust).key.export({format:'pem',type:'spki'});}
export function bindAcquisitionPermitTrust(permit,trust,now=Date.now()) {
 const t=record(trust);assert(t.notBefore<=now&&now<t.notAfter,'Inactive/expired trust');
 assert.equal(permit.trustId,t.trustId,'Wrong acquisition trust identity');
 assert.equal(permit.trustGeneration,t.generation,'Stale acquisition trust generation');
 assert.equal(permit.trustConfigSha256,t.configurationSha256,'Wrong trust configuration binding');
 assert.equal(permit.trustRootSha256,t.rootSpkiSha256,'Wrong trust-root binding');
 assert(Number.isSafeInteger(permit.issuedAt)&&permit.issuedAt>=t.notBefore&&Number.isSafeInteger(permit.expiresAt)&&permit.expiresAt<=t.notAfter,'Permit outside trust lifetime');
}
