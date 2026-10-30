import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sha256,verifyComponentMeasurement,decodeMeasurementEvidence} from './contracts.mjs';
const components={node:'unit-measurement',jdk:'unit-measurement'};
const bytes=Buffer.from(JSON.stringify(components));
const provenance=()=>({components:{...components},actualComponents:{...components},componentMeasurementSha256:sha256(bytes)});
test('actual component bytes are independently SHA-256 verified',()=>assert.deepEqual(verifyComponentMeasurement(provenance(),bytes),components));
test('missing actual measurement evidence rejects',()=>assert.throws(()=>verifyComponentMeasurement(provenance(),undefined)));
test('changed measurement bytes reject even with a correctly formatted recorded hash',()=>assert.throws(()=>verifyComponentMeasurement(provenance(),Buffer.from('{}'))));
test('malformed measurement JSON rejects even with matching SHA-256',()=>{const b=Buffer.from('{invalid');assert.throws(()=>verifyComponentMeasurement({...provenance(),componentMeasurementSha256:sha256(b)},b));});
test('array-shaped evidence rejects with matching checksum',()=>{const b=Buffer.from('[]');assert.throws(()=>verifyComponentMeasurement({...provenance(),componentMeasurementSha256:sha256(b)},b));});
test('measurement component substitution rejects after checksum calculation',()=>{const b=Buffer.from(JSON.stringify({...components,node:'other'}));assert.throws(()=>verifyComponentMeasurement({...provenance(),componentMeasurementSha256:sha256(b)},b));});
test('oversized measurement evidence rejects',()=>assert.throws(()=>verifyComponentMeasurement(provenance(),Buffer.alloc(65537))));
test('measurement channel remains protected and independent approval is preserved',()=>{const w=fs.readFileSync(new URL('../../.github/workflows/android-certification.yml',import.meta.url),'utf8');assert(w.includes('secrets.KLM_CERTIFICATION_COMPONENT_MEASUREMENT_B64'));assert(w.includes('environment: android-certification'));const v=fs.readFileSync(new URL('./verify.mjs',import.meta.url),'utf8');assert(v.includes('verifyPermit('));assert(v.includes('validateEnvironment('));assert(v.includes('Date.now(),measurementBytes'));assert.equal(JSON.parse(fs.readFileSync(new URL('./toolchain.json',import.meta.url))).nativeExecutionEnabled,false);});

test('malformed protected-source base64 rejects without trusting a hash',()=>{assert.throws(()=>decodeMeasurementEvidence('!!!!'));assert.throws(()=>decodeMeasurementEvidence('e30=garbage'));assert.deepEqual(decodeMeasurementEvidence(bytes.toString('base64')),bytes);});
