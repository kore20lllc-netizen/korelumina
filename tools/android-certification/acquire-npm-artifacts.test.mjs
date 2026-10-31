import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {compileFunction} from 'node:vm';
import {isIP} from 'node:net';
import {createPublicKey,verify,createHmac,timingSafeEqual,generateKeyPairSync,sign} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {inventory,verifyOfflineNpm,hash} from './offline-npm.mjs';
import {prepareNpmCache} from './prepare-npm-cache.mjs';
import {loadAcquisitionTrust,requireProductionAcquisitionTrust,acquisitionPublicKey,bindAcquisitionPermitTrust} from './acquisition-trust.mjs';
import {verifyPermit,LIMITS} from './contracts.mjs';
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

// R6D: ephemeral synthetic authority only. No real permit is created or activated.
function securityCore(overrides={}) {
 const deps={fs,path,assert,isIP,inventory,verifyOfflineNpm,hash,prepareNpmCache,createPublicKey,verify,createHmac,timingSafeEqual,...overrides};
 return compileFunction(text.replace(/^import .*;$/gm,'').replace(/export /g,'')+'\nreturn {verifyAcquisitionGrant,AcquisitionBudget,rejectNetworkOverrides,trustedTransport,runAcquisition};',Object.keys(deps))(...Object.values(deps));
}
const sec=securityCore();const syntheticKeys=generateKeyPairSync('ed25519');
function envelope(grant,key=syntheticKeys.privateKey){const payload=JSON.stringify(grant);return Buffer.from(JSON.stringify({payload,signature:sign(null,Buffer.from(payload),key).toString('base64')})).toString('base64');}
function syntheticGrant(f,patch={}) {const job=f.job(),plan={...inventory(job.locks),lockSetFingerprint:job.expectedLockSetFingerprint};
 const grant={schemaVersion:'klm-npm-acquisition-permit:v1',scope:'npm-artifact-acquisition',repository:'kore20lllc-netizen/korelumina',lockSetFingerprint:plan.lockSetFingerprint,inventorySha256:hash(JSON.stringify(plan.artifacts)),destination:'https://registry.npmjs.org:443',limits:{...ACQUISITION_LIMITS},deadlines:{connectionMs:5000,responseMs:10000},budgetId:'a'.repeat(64),attemptId:'b'.repeat(64),operation:'create',issuedAt:Date.now()-100,expiresAt:Date.now()+60000,addresses:['104.16.26.34'],...patch};return {grant,plan};}
const validate=(grant,plan,key=syntheticKeys.privateKey)=>sec.verifyAcquisitionGrant(envelope(grant,key),syntheticKeys.publicKey.export({type:'spki',format:'pem'}),plan);
function budget(f,grant){return new sec.AcquisitionBudget(f.root,Buffer.alloc(32,7),grant);}
test('R6D separate signed acquisition authority validates exact binding',()=>fixture(f=>{const {grant,plan}=syntheticGrant(f);assert.deepEqual(validate(grant,plan),grant);}));
test('R6D invalid signature rejects',()=>fixture(f=>{const {grant,plan}=syntheticGrant(f);assert.throws(()=>validate(grant,plan,generateKeyPairSync('ed25519').privateKey));}));
for(const [field,value] of [['scope','one-debug-apk'],['lockSetFingerprint','0'.repeat(64)],['inventorySha256','0'.repeat(64)],['destination','https://evil.invalid:443'],['expiresAt',1],['addresses',['127.0.0.1']]])test('R6D permit rejects '+field,()=>fixture(f=>{const {grant,plan}=syntheticGrant(f,{[field]:value});assert.throws(()=>validate(grant,plan));}));
test('R6D malformed authorization rejects',()=>assert.throws(()=>sec.verifyAcquisitionGrant('malformed','missing',{})));
test('R6D byte-limit amendment rejects',()=>fixture(f=>{const {grant,plan}=syntheticGrant(f);grant.limits.totalBytes++;assert.throws(()=>validate(grant,plan));}));
test('R6D deadline amendment rejects',()=>fixture(f=>{const {grant,plan}=syntheticGrant(f);grant.deadlines.connectionMs++;assert.throws(()=>validate(grant,plan));}));
test('R6D completed authorization cannot replay',()=>fixture(f=>{const {grant}=syntheticGrant(f);const a=budget(f,grant);a.start();a.close(true);assert.throws(()=>budget(f,grant).start());}));
test('R6D resume requires a new signed attempt identity',()=>fixture(f=>{const {grant}=syntheticGrant(f);const a=budget(f,grant);a.start();a.close(false);assert.throws(()=>budget(f,{...grant,operation:'resume'}).start());}));
test('R6D missing resume budget evidence rejects',()=>fixture(f=>{const {grant}=syntheticGrant(f);assert.throws(()=>budget(f,{...grant,operation:'resume'}).start());}));
test('R6D failed transfer keeps full conservative debit across resume',()=>fixture(f=>{const {grant}=syntheticGrant(f);const a=budget(f,grant);a.start();a.reserve('unit');a.observe(3);a.close(false);const b=budget(f,{...grant,operation:'resume',attemptId:'c'.repeat(64)});b.start();assert.equal(b.read().state.charged,ACQUISITION_LIMITS.artifactBytes);b.close(false);}));
test('R6D interrupted reservations survive reinitialization',()=>fixture(f=>{const {grant}=syntheticGrant(f);const a=budget(f,grant);a.start();a.reserve('unit');const snapshot=JSON.parse(fs.readFileSync(f.root+'/'+grant.budgetId+'.json'));assert.equal(snapshot.at(-1).state.charged,67108864);a.close(false);}));
test('R6D concurrent budget contention fails closed',()=>fixture(f=>{const {grant}=syntheticGrant(f);const a=budget(f,grant);a.start();try{assert.throws(()=>budget(f,{...grant,operation:'resume',attemptId:'c'.repeat(64)}).start());}finally{a.close(false);}}));
test('R6D tampered budget evidence rejects',()=>fixture(f=>{const {grant}=syntheticGrant(f);const a=budget(f,grant);a.start();a.close(false);const file=f.root+'/'+grant.budgetId+'.json',r=JSON.parse(fs.readFileSync(file));r.at(-1).state.charged=7;fs.writeFileSync(file,JSON.stringify(r));assert.throws(()=>budget(f,{...grant,operation:'resume',attemptId:'c'.repeat(64)}).start());}));
test('R6D removed ledger cannot reset a spent create permit',()=>fixture(f=>{const {grant}=syntheticGrant(f);const a=budget(f,grant);a.start();a.close(false);fs.unlinkSync(f.root+'/'+grant.budgetId+'.json');assert.throws(()=>budget(f,grant).start());}));
test('R6D repeated failed transfers exhaust cumulative ceiling',()=>fixture(f=>{const {grant}=syntheticGrant(f);let current=grant;for(let i=0;i<4;i++){const b=budget(f,current);b.start();b.reserve('unit');b.close(false);current={...grant,operation:'resume',attemptId:String(i+1).repeat(64)};}const b=budget(f,current);b.start();try{assert.throws(()=>b.reserve('unit'));}finally{b.close(false);}}));
test('R6D successful settlement charges independently verified bytes',()=>fixture(f=>{const {grant}=syntheticGrant(f);const b=budget(f,grant);b.start();b.reserve('unit');b.observe(23);b.settle(23);assert.equal(b.read().state.charged,23);b.close(true);}));
test('R6D proxy and insecure TLS overrides reject',()=>{for(const key of ['HTTPS_PROXY','http_proxy','ALL_PROXY','NO_PROXY','NODE_TLS_REJECT_UNAUTHORIZED','NODE_EXTRA_CA_CERTS'])assert.throws(()=>sec.rejectNetworkOverrides({[key]:'set'}));});
function transportHarness(patch={}) {
 const response=new PassThrough();response.statusCode=patch.status??200;response.headers={'content-length':'1'};
 const makeSocket=()=>{const socket=new EventEmitter();Object.assign(socket,{authorized:patch.authorized??true,remoteAddress:patch.remoteAddress??'104.16.26.34',remotePort:443,getPeerCertificate:()=>({}),destroy:()=>{}});queueMicrotask(()=>socket.emit('secureConnect'));return socket;};
 let requests=0;const tls={rootCertificates:['synthetic'],checkServerIdentity:()=>patch.tlsError,connect:options=>{assert.equal(options.rejectUnauthorized,true);assert.equal(options.servername,'registry.npmjs.org');return makeSocket();}};
 const https={Agent:class{destroy(){}},request:(url,options,done)=>{requests++;const req=new EventEmitter();req.destroy=error=>queueMicrotask(()=>req.emit('error',error??Error('cancelled')));req.end=()=>{if(!patch.stallResponse)queueMicrotask(()=>done(response));};return req;}};
 const core=securityCore({lookup:async()=>patch.stallDns?await new Promise(()=>{}):patch.addresses??[{address:'104.16.26.34'}],tls,https});
 return {core,response,requests:()=>requests};
}
async function transportCase(patch,fn){const t=transportHarness(patch),signal=new AbortController();try{await fn(t,{url:'https://registry.npmjs.org/example/-/example-1.0.0.tgz',signal:signal.signal},{expiresAt:Date.now()+60000,addresses:['104.16.26.34'],deadlines:{connectionMs:100,responseMs:100}});}finally{signal.abort();t.response.destroy();}}
test('R6D trusted connector uses pinned DNS and TLS facts',()=>transportCase({},async(t,r,g)=>{const result=await t.core.trustedTransport(r,g);assert.equal(result.remoteAddress,'104.16.26.34');assert.equal(t.requests(),1);}));
test('R6D DNS mismatch denies before HTTP',()=>transportCase({addresses:[{address:'104.16.99.99'}]},async(t,r,g)=>{await assert.rejects(t.core.trustedTransport(r,g));assert.equal(t.requests(),0);}));
test('R6D socket destination mismatch denies before HTTP',()=>transportCase({remoteAddress:'104.16.99.99'},async(t,r,g)=>{await assert.rejects(t.core.trustedTransport(r,g));assert.equal(t.requests(),0);}));
test('R6D TLS failure denies before HTTP',()=>transportCase({authorized:false},async(t,r,g)=>{await assert.rejects(t.core.trustedTransport(r,g));assert.equal(t.requests(),0);}));
test('R6D real connector rejects redirect without follow-up',()=>transportCase({status:302},async(t,r,g)=>{await assert.rejects(t.core.trustedTransport(r,g));assert.equal(t.requests(),1);}));
test('R6D signed authorized simulation integrates durable ledger and R6B',()=>fixture(async f=>{const {grant,plan}=syntheticGrant(f);validate(grant,plan);const b=budget(f,grant);b.start();try{const result=await sec.runAcquisition(f.job(),async req=>f.response(req),f.policy,b);assert(result.complete);assert.equal(b.read().state.charged,f.data.length);b.close(true);}finally{b.close(false);}}));

test('R6D truncated authentic journal is rejected by independent head',()=>fixture(f=>{const {grant}=syntheticGrant(f);const b=budget(f,grant);b.start();b.reserve('unit');b.close(false);const file=f.root+'/'+grant.budgetId+'.json',entries=JSON.parse(fs.readFileSync(file));fs.writeFileSync(file,JSON.stringify(entries.slice(0,1)));assert.throws(()=>budget(f,{...grant,operation:'resume',attemptId:'c'.repeat(64)}).start());}));
test('R6D missing authenticated journal head fails closed',()=>fixture(f=>{const {grant}=syntheticGrant(f);const b=budget(f,grant);b.start();b.close(false);fs.unlinkSync(f.root+'/'+grant.budgetId+'.head');assert.throws(()=>budget(f,{...grant,operation:'resume',attemptId:'c'.repeat(64)}).start());}));
test('R6D oversized failed reads remain recorded before rejection',()=>fixture(f=>{const {grant}=syntheticGrant(f);const b=budget(f,grant);b.start();b.reserve('unit');assert.throws(()=>b.observe(ACQUISITION_LIMITS.artifactBytes+1));assert.equal(b.read().state.reservation.observed,ACQUISITION_LIMITS.artifactBytes+1);b.close(false);assert.throws(()=>budget(f,{...grant,operation:'resume',attemptId:'c'.repeat(64)}).start());}));

test('R6D DNS connection deadline is enforced offline',()=>transportCase({stallDns:true},async(t,r,g)=>{await assert.rejects(t.core.trustedTransport(r,{...g,deadlines:{connectionMs:5,responseMs:10}}),/deadline/);assert.equal(t.requests(),0);}));
test('R6D HTTP response deadline is enforced offline',()=>transportCase({stallResponse:true},async(t,r,g)=>{await assert.rejects(t.core.trustedTransport(r,{...g,deadlines:{connectionMs:100,responseMs:5}}),/deadline/);}));

test('R6D noncanonical signature encoding rejects',()=>fixture(f=>{const {grant,plan}=syntheticGrant(f);const e=JSON.parse(Buffer.from(envelope(grant),'base64'));e.signature+=' ';assert.throws(()=>sec.verifyAcquisitionGrant(Buffer.from(JSON.stringify(e)).toString('base64'),syntheticKeys.publicKey.export({type:'spki',format:'pem'}),plan));}));

// R6E reuses the pre-existing baseline fixture key; no new key generation or real trust.
function trustFixture(patch={}) {
 const config={schemaVersion:'klm-npm-acquisition-trust:v1',purpose:'npm-artifact-acquisition',environment:'synthetic',trustId:'unit-acquisition',generation:1,publicKeyPem:syntheticKeys.publicKey.export({format:'pem',type:'spki'}),notBefore:Date.now()-1000,notAfter:Date.now()+3600000,...patch};
 const bytes=Buffer.from(JSON.stringify(config)),pin={configurationSha256:hash(bytes),rootSpkiSha256:hash(createPublicKey(config.publicKeyPem).export({format:'der',type:'spki'})),trustId:config.trustId,generation:config.generation};
 return {config,bytes,pin,load:options=>loadAcquisitionTrust(bytes,pin,{mode:'synthetic',...options})};
}
function trustFields(t){return {trustId:t.trustId,trustGeneration:t.generation,trustConfigSha256:t.configurationSha256,trustRootSha256:t.rootSpkiSha256};}
test('R6E absent acquisition trust fails closed',()=>assert.throws(()=>loadAcquisitionTrust(undefined,{})));
test('R6E malformed trust configuration rejects',()=>{const bytes=Buffer.from('{}');assert.throws(()=>loadAcquisitionTrust(bytes,{configurationSha256:hash(bytes),rootSpkiSha256:'0'.repeat(64),trustId:'unit',generation:1}));});
test('R6E independently pinned root identity must match',()=>{const f=trustFixture();assert.throws(()=>loadAcquisitionTrust(f.bytes,{...f.pin,rootSpkiSha256:'0'.repeat(64)},{mode:'synthetic'}));});
test('R6E substituted public key rejects despite updated configuration hash',()=>{const f=trustFixture();const other=createPublicKey({format:'der',type:'spki',key:Buffer.from('302a300506032b6570032100d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a','hex')});const bytes=Buffer.from(JSON.stringify({...f.config,publicKeyPem:other.export({format:'pem',type:'spki'})}));assert.throws(()=>loadAcquisitionTrust(bytes,{...f.pin,configurationSha256:hash(bytes)},{mode:'synthetic'}));});
test('R6E untrusted request object cannot impersonate loaded trust',()=>{const t=trustFixture().load();assert.throws(()=>requireProductionAcquisitionTrust({...t}));assert.throws(()=>acquisitionPublicKey({...t}));});
test('R6E request-supplied trust cannot enable acquisition',async()=>{const t=trustFixture().load();await assert.rejects(acquireNpmArtifacts({trust:t,authority:t,enabled:true}),/authorization_unavailable/);});
test('R6E invalid signature rejects against configured acquisition key',()=>fixture(f=>{const t=trustFixture().load(),{grant,plan}=syntheticGrant(f,trustFields(t));const e=JSON.parse(Buffer.from(envelope(grant),'base64'));e.signature=Buffer.alloc(64).toString('base64');assert.throws(()=>sec.verifyAcquisitionGrant(Buffer.from(JSON.stringify(e)).toString('base64'),acquisitionPublicKey(t),plan));}));
test('R6E valid synthetic signature binds exact loaded trust',()=>fixture(f=>{const t=trustFixture().load(),{grant,plan}=syntheticGrant(f,trustFields(t));const verified=sec.verifyAcquisitionGrant(envelope(grant),acquisitionPublicKey(t),plan);bindAcquisitionPermitTrust(verified,t);assert(Object.isFrozen(t));}));
test('R6E trust rotation rejects previous-generation permits',()=>fixture(f=>{const first=trustFixture(),old=first.load();const next=trustFixture({...first.config,generation:2,notBefore:first.config.notBefore+1});const rotated=next.load({previous:old});const {grant}=syntheticGrant(f,trustFields(old));assert.throws(()=>bindAcquisitionPermitTrust(grant,rotated));}));
test('R6E rotation cannot downgrade generation',()=>{const f=trustFixture(),old=f.load();assert.throws(()=>f.load({previous:old}));});
test('R6E same root under new configuration cannot silently admit old binding',()=>fixture(f=>{const first=trustFixture(),old=first.load();const next=trustFixture({...first.config,generation:2});const t=next.load({previous:old});const {grant}=syntheticGrant(f,{...trustFields(old),trustGeneration:2});assert.throws(()=>bindAcquisitionPermitTrust(grant,t));}));
test('R6E expired acquisition authorization still rejects',()=>fixture(f=>{const t=trustFixture().load(),{grant,plan}=syntheticGrant(f,{...trustFields(t),expiresAt:1});assert.throws(()=>sec.verifyAcquisitionGrant(envelope(grant),acquisitionPublicKey(t),plan));}));
test('R6E APK permit cannot establish acquisition authority',()=>fixture(f=>{const t=trustFixture().load(),{grant,plan}=syntheticGrant(f,{...trustFields(t),schemaVersion:'klm-execution-permit:v1',scope:'one-debug-apk'});assert.throws(()=>sec.verifyAcquisitionGrant(envelope(grant),acquisitionPublicKey(t),plan));}));
test('R6E acquisition permit cannot establish APK authority',()=>fixture(f=>{const t=trustFixture().load(),{grant}=syntheticGrant(f,trustFields(t));assert.throws(()=>verifyPermit(envelope({...grant,limits:LIMITS}),acquisitionPublicKey(t),{}));}));
test('R6E production loader rejects synthetic trust configuration',()=>{const f=trustFixture();assert.throws(()=>loadAcquisitionTrust(f.bytes,f.pin));});
test('R6E production boundary rejects loaded synthetic trust receipt',()=>assert.throws(()=>requireProductionAcquisitionTrust(trustFixture().load())));
test('R6E expired trust rejects',()=>{const f=trustFixture({notAfter:1});assert.throws(()=>f.load());});
test('R6E permit predating trust activation rejects',()=>fixture(f=>{const t=trustFixture().load(),{grant}=syntheticGrant(f,{...trustFields(t),issuedAt:t.notBefore-1});assert.throws(()=>bindAcquisitionPermitTrust(grant,t));}));
test('R6E budget identity cannot resume under substituted trust generation',()=>fixture(f=>{const t=trustFixture().load(),{grant}=syntheticGrant(f,trustFields(t));const b=budget(f,grant);b.start();b.close(false);assert.throws(()=>budget(f,{...grant,operation:'resume',attemptId:'c'.repeat(64),trustGeneration:2}).start());}));
test('R6E disabled-by-default boundary remains closed',async()=>assert.rejects(acquireNpmArtifacts(),/authorization_unavailable/));

test('R6E previously unbound permits are not grandfathered into configured trust',()=>fixture(f=>{const t=trustFixture().load(),{grant,plan}=syntheticGrant(f);const verified=sec.verifyAcquisitionGrant(envelope(grant),acquisitionPublicKey(t),plan);assert.throws(()=>bindAcquisitionPermitTrust(verified,t));}));
