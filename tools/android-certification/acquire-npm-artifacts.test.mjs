import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {compileFunction} from 'node:vm';
import {isIP} from 'node:net';
import {inventory,verifyOfflineNpm,hash} from './offline-npm.mjs';
import {prepareNpmCache} from './prepare-npm-cache.mjs';
import {acquireNpmArtifacts,ACQUISITION_LIMITS} from './acquire-npm-artifacts.mjs';
// Lexical test instrumentation only. No hook or transport is exported by production.
const text=fs.readFileSync(new URL('./acquire-npm-artifacts.mjs',import.meta.url),'utf8');
const privateCore=compileFunction(text.replace(/^import .*;$/gm,'').replace(/export /g,'')+'\nreturn {runAcquisition,makePlan,identity};',['fs','path','assert','isIP','inventory','verifyOfflineNpm','hash','prepareNpmCache'])(fs,path,assert,isIP,inventory,verifyOfflineNpm,hash,prepareNpmCache);
async function fixture(fn){
 const root=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'klm-acquire-'));fs.chmodSync(root,0o700);const source=root+'/source',jobroot=root+'/job';fs.mkdirSync(source,{mode:0o700});fs.mkdirSync(jobroot,{mode:0o700});
 const data=Buffer.from('synthetic archive bytes');const pkg={version:'1.0.0',resolved:'https://registry.npmjs.org/example/-/example-1.0.0.tgz',integrity:'sha512-'+hash(data,'sha512','base64')};
 const lock={name:'unit',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'unit',version:'1.0.0',dependencies:{example:'1.0.0'}},'node_modules/example':pkg}};
 const job=()=>{const bytes=Buffer.from(JSON.stringify(lock)),locks=[{id:'unit',packageName:'unit',bytes,expectedSha256:hash(bytes)}];return {locks,expectedLockSetFingerprint:hash(JSON.stringify(inventory(locks).locks)),root:jobroot,sourceCache:source,expectedReferences:Object.keys(lock.packages).length-1};};
 const policy={artifactBytes:100,totalBytes:200,requestMs:500,overallMs:2000,transfers:36,retries:0};let calls=0;
 const response=(request,patch={})=>({url:request.url,status:200,tlsAuthorized:true,servername:'registry.npmjs.org',remotePort:443,approvedAddresses:['104.16.26.34'],remoteAddress:'104.16.26.34',contentEncoding:'identity',contentLength:data.length,body:(async function*(){yield data;})(),...patch});
 const run=(patch={},override={},jobPatch={})=>privateCore.runAcquisition({...job(),...jobPatch},async request=>{calls++;return response(request,patch);},{...policy,...override});
 try{await fn({root,jobroot,source,data,pkg,lock,job,policy,response,run,calls:()=>calls});}finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('valid reviewed artifact publishes only via R6B',()=>fixture(async f=>{const r=await f.run();assert(r.complete);assert.equal(r.artifacts[0].sha256,hash(f.data));assert.equal(r.artifacts[0].bytes,f.data.length);assert(fs.existsSync(f.jobroot+'/prepared/receipt.json'));}));
test('public acquisition always denies missing authority',async()=>assert.rejects(acquireNpmArtifacts(),/authorization_unavailable/));
test('flags and injectable callbacks cannot authorize public acquisition',async()=>{let called=false;await assert.rejects(acquireNpmArtifacts({enabled:true,authorization:'GREEN',transport:()=>{called=true;}}));assert(!called);});
test('unreviewed response artifact rejects',()=>fixture(f=>assert.rejects(f.run({url:'https://registry.npmjs.org/other.tgz'}))));
test('lock-set fingerprint mismatch rejects before transport',()=>fixture(async f=>{await assert.rejects(f.run({}, {},{expectedLockSetFingerprint:'0'.repeat(64)}));assert.equal(f.calls(),0);}));
test('unauthorized registry host rejects before transport',()=>fixture(async f=>{f.pkg.resolved='https://evil.invalid/a.tgz';await assert.rejects(async()=>f.run());assert.equal(f.calls(),0);}));
test('URL credentials reject before transport',()=>fixture(async f=>{f.pkg.resolved='https://user@registry.npmjs.org/a.tgz';await assert.rejects(async()=>f.run());}));
test('HTTP URL rejects before transport',()=>fixture(async f=>{f.pkg.resolved=f.pkg.resolved.replace('https:','http:');await assert.rejects(async()=>f.run());}));
test('same-host redirect rejects',()=>fixture(f=>assert.rejects(f.run({status:302,location:'https://registry.npmjs.org/elsewhere'}))));
test('unexpected connection address rejects',()=>fixture(f=>assert.rejects(f.run({remoteAddress:'104.16.27.34'}))));
test('private DNS destination rejects',()=>fixture(f=>assert.rejects(f.run({approvedAddresses:['127.0.0.1'],remoteAddress:'127.0.0.1'}))));
test('unapproved connection port rejects',()=>fixture(f=>assert.rejects(f.run({remotePort:444}))));
test('invalid TLS rejects',()=>fixture(f=>assert.rejects(f.run({tlsAuthorized:false}))));
test('wrong TLS servername rejects',()=>fixture(f=>assert.rejects(f.run({servername:'evil.invalid'}))));
test('truncated response rejects',()=>fixture(f=>assert.rejects(f.run({contentLength:f.data.length+1}))));
test('SHA512 mismatch rejects',()=>fixture(f=>assert.rejects(f.run({body:(async function*(){yield Buffer.alloc(f.data.length);})()}))));
test('per artifact received ceiling rejects dishonest response',()=>fixture(f=>assert.rejects(f.run({contentLength:1,body:(async function*(){yield Buffer.alloc(101);})()}))));
test('aggregate received ceiling rejects',()=>fixture(f=>assert.rejects(f.run({}, {totalBytes:1}))));
test('request timeout aborts and removes partial file',()=>fixture(async f=>{await assert.rejects(f.run({body:(async function*(){await new Promise(r=>setTimeout(r,25));yield f.data;})()},{requestMs:5}),/timeout/);assert(!fs.existsSync(f.jobroot+'/transfer.part'));}));
test('overall timeout aborts',()=>fixture(f=>assert.rejects(f.run({body:(async function*(){await new Promise(r=>setTimeout(r,25));yield f.data;})()},{overallMs:5}),/timeout/)));
test('cancellation before transfer rejects',()=>fixture(f=>{const a=new AbortController();a.abort();return assert.rejects(f.run({}, {},{signal:a.signal}));}));
test('interrupted transfer cleans only job temporary data',()=>fixture(async f=>{await assert.rejects(f.run({body:(async function*(){yield f.data.subarray(0,2);throw Error('interruption');})()}));assert(!fs.existsSync(f.jobroot+'/transfer.part'));assert(!fs.existsSync(f.jobroot+'/.acquisition-owner'));}));
test('symlink acquisition root rejects',()=>fixture(async f=>{const alias=f.root+'/alias';fs.symlinkSync(f.jobroot,alias);await assert.rejects(f.run({}, {},{root:alias}));}));
test('unsafe acquisition path rejects',()=>fixture(f=>assert.rejects(f.run({}, {},{root:f.jobroot+'/../job'}))));
test('duplicate integrity identities require one transfer',()=>fixture(async f=>{f.lock.packages['node_modules/other']={...f.pkg,resolved:'https://registry.npmjs.org/other/-/other-1.0.0.tgz'};const r=await f.run();assert.equal(f.calls(),1);assert.equal(r.artifacts.length,2);}));
test('restart rehashes and reuses completed content without transfer',()=>fixture(async f=>{const a=await f.run(),n=f.calls(),b=await f.run();assert.equal(f.calls(),n);assert.deepEqual(a,b);}));
test('restart rejects corrupted cached content',()=>fixture(async f=>{await f.run();const a=inventory(f.job().locks).artifacts[0];fs.writeFileSync(f.jobroot+'/seed/cache/npm/_cacache/'+a.contentPath,'bad');await assert.rejects(f.run());}));
test('incomplete dependency closure rejects',()=>fixture(f=>{f.pkg.dependencies={missing:'1.0.0'};return assert.rejects(f.run());}));
test('unexpected job-owned tree content rejects',()=>fixture(f=>{fs.writeFileSync(f.jobroot+'/unexpected','x');return assert.rejects(f.run());}));
test('no retries occur on response failure',()=>fixture(async f=>{await assert.rejects(f.run({status:503}));assert.equal(f.calls(),1);}));
test('requests are sequential',()=>fixture(async f=>{f.lock.packages['node_modules/other']={...f.pkg,resolved:'https://registry.npmjs.org/other/-/other-1.0.0.tgz',integrity:'sha512-'+hash(Buffer.from('second'),'sha512','base64')};let active=0,peak=0;const r=await privateCore.runAcquisition(f.job(),async request=>{active++;peak=Math.max(peak,active);const data=request.url.includes('/other/')?Buffer.from('second'):f.data;return f.response(request,{contentLength:data.length,body:(async function*(){yield data;active--;})()});},f.policy);assert(r.complete);assert.equal(peak,1);}));
test('fixed production ceilings remain unchanged',()=>{assert.deepEqual(ACQUISITION_LIMITS,{artifactBytes:67108864,totalBytes:268435456,requestMs:30000,overallMs:600000,transfers:36,retries:0});});
test('production exports no test transport hook',async()=>{const api=await import('./acquire-npm-artifacts.mjs');assert.deepEqual(Object.keys(api).sort(),['ACQUISITION_LIMITS','acquireNpmArtifacts','planNpmAcquisition'].sort());});

test('aggregate limit includes earlier successful transfers',()=>fixture(async f=>{f.lock.packages['node_modules/other']={...f.pkg,resolved:'https://registry.npmjs.org/other/-/other-1.0.0.tgz',integrity:'sha512-'+hash(Buffer.from('second'),'sha512','base64')};await assert.rejects(privateCore.runAcquisition(f.job(),async req=>{const data=req.url.includes('/other/')?Buffer.from('second'):f.data;return f.response(req,{contentLength:data.length,body:(async function*(){yield data;})()});},{...f.policy,totalBytes:f.data.length+1}),/Aggregate/);}));
test('interrupted quarantine index publication can restart',()=>fixture(async f=>{const original=fs.renameSync;fs.renameSync=(a,b)=>{if(b.includes('/index-v5/'))throw Error('interrupted index');return original(a,b);};try{await assert.rejects(f.run());}finally{fs.renameSync=original;}const r=await f.run();assert(r.complete);}));
