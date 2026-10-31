import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inventory,hash} from './offline-npm.mjs';
import {prepareNpmCache} from './prepare-npm-cache.mjs';
function fixture(fn){
 const root=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'klm-prepare-')),source=path.join(root,'source'),dest=path.join(root,'dedicated');fs.mkdirSync(source);
 const blob=Buffer.from('synthetic npm tarball; never installed');
 const pkg={version:'1.0.0',resolved:'https://registry.npmjs.org/example/-/example-1.0.0.tgz',integrity:'sha512-'+hash(blob,'sha512','base64')};
 const lock={name:'unit-wrapper',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'unit-wrapper',version:'1.0.0',dependencies:{example:'1.0.0'}},'node_modules/example':pkg}};
 const locks=()=>{const bytes=Buffer.from(JSON.stringify(lock));return [{id:'unit',packageName:'unit-wrapper',bytes,expectedSha256:hash(bytes)}];};
 const a=inventory(locks()).artifacts[0];const put=(rel,data)=>{const file=path.join(source,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);};
 put(a.contentPath,blob);const entry=JSON.stringify({key:a.cacheKey,integrity:a.integrity,size:blob.length});put(a.indexPath,'\n'+hash(entry,'sha1')+'\t'+entry);
 const options=()=>({locks:locks(),sourceCache:source,destination:dest,expectedArtifacts:1,limits:{maxArtifacts:4,maxArtifactBytes:1024,maxTotalBytes:4096}});
 const run=(extra={})=>prepareNpmCache({...options(),...extra});
 try{fn({root,source,dest,blob,pkg,lock,locks,a,put,options,run});}finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('verified reuse prepares strict cache with independent hashes',()=>fixture(f=>{const r=f.run();assert(r.receipt.complete);assert.equal(r.receipt.artifacts[0].sha256,hash(f.blob));assert.equal(r.receipt.artifacts[0].bytes,f.blob.length);assert.equal(r.receipt.offlineInstallationVerified,false);}));
test('shared source remains unchanged',()=>fixture(f=>{const before=fs.readFileSync(path.join(f.source,f.a.indexPath));f.run();assert.deepEqual(fs.readFileSync(path.join(f.source,f.a.indexPath)),before);}));
test('corrupted source rejects',()=>fixture(f=>{f.put(f.a.contentPath,'corrupt');assert.throws(()=>f.run());}));
test('truncated source rejects',()=>fixture(f=>{f.put(f.a.contentPath,f.blob.subarray(0,3));assert.throws(()=>f.run());}));
test('substituted SHA512 fails closed',()=>fixture(f=>{f.pkg.integrity='sha512-'+hash(Buffer.from('other'),'sha512','base64');assert.throws(()=>f.run());}));
test('unapproved registry rejects',()=>fixture(f=>{f.pkg.resolved='https://unapproved.invalid/a.tgz';assert.throws(()=>f.run());}));
test('redirect acquisition interface is unavailable',()=>fixture(f=>assert.throws(()=>f.run({acquire:()=>({status:302,location:'https://evil.invalid'})}),/prohibited/)));
test('network enabled flag cannot authorize acquisition',()=>fixture(f=>assert.throws(()=>f.run({networkEnabled:true}),/prohibited/)));
test('unsafe output path rejects',()=>fixture(f=>assert.throws(()=>f.run({destination:f.root+'/absent/../escape'}))));
test('source symlink rejects',()=>fixture(f=>{const alias=path.join(f.root,'alias');fs.symlinkSync(f.source,alias);assert.throws(()=>f.run({sourceCache:alias}));}));
test('destination symlink rejects',()=>fixture(f=>{fs.symlinkSync(f.source,f.dest);assert.throws(()=>f.run());}));
test('duplicate integrity identities share one blob and preserve URL indexes',()=>fixture(f=>{f.lock.packages['node_modules/other']={...f.pkg,resolved:'https://registry.npmjs.org/other/-/other-1.0.0.tgz'};const r=f.run({expectedArtifacts:2});assert.equal(r.uniqueIntegrityIdentities,1);assert.equal(r.inventory.verified.length,2);}));
test('unexpected dedicated cache content rejects on restart',()=>fixture(f=>{f.run();fs.writeFileSync(path.join(f.dest,'cache/npm/_cacache/unexpected'),'extra');assert.throws(()=>f.run());}));
test('artifact count limit rejects',()=>fixture(f=>assert.throws(()=>f.run({limits:{...f.options().limits,maxArtifacts:0}}))));
test('per artifact byte limit rejects',()=>fixture(f=>assert.throws(()=>f.run({limits:{...f.options().limits,maxArtifactBytes:1}}))));
test('total byte limit rejects',()=>fixture(f=>assert.throws(()=>f.run({limits:{...f.options().limits,maxTotalBytes:1}}))));
test('cancellation prevents preparation',()=>fixture(f=>{const c=new AbortController();c.abort();assert.throws(()=>f.run({signal:c.signal}));assert(!fs.existsSync(f.dest));}));
function interrupt(f,match){const original=fs.renameSync;let hit=false;fs.renameSync=(from,to)=>{if(match(to)){hit=true;throw Error('synthetic interruption');}return original(from,to);};try{assert.throws(()=>f.run());assert(hit);}finally{fs.renameSync=original;}assert(!fs.existsSync(path.join(f.dest,'.owner-lock')));}
test('interrupted content publication resumes safely',()=>fixture(f=>{interrupt(f,to=>to.includes('/content-v2/'));assert(f.run().receipt.complete);}));
test('interrupted index publication rehashes orphan content',()=>fixture(f=>{interrupt(f,to=>to.includes('/index-v5/'));assert(f.run().receipt.complete);}));
test('interrupted receipt publication recovers verified state',()=>fixture(f=>{interrupt(f,to=>to.endsWith('/receipt.json'));assert(f.run().receipt.complete);}));
test('restart rejects changed completed bytes',()=>fixture(f=>{f.run();fs.writeFileSync(path.join(f.dest,'cache/npm/_cacache',f.a.contentPath),'corrupt');assert.throws(()=>f.run());}));
test('missing artifacts produce incomplete receipt',()=>fixture(f=>{fs.unlinkSync(path.join(f.source,f.a.contentPath));const r=f.run();assert(!r.receipt.complete);assert.equal(r.inventory.missing.length,1);}));
test('incomplete dependency graph rejects',()=>fixture(f=>{f.pkg.dependencies={absent:'1.0.0'};assert.throws(()=>f.run());}));
test('deterministic receipts survive restart',()=>fixture(f=>assert.deepEqual(f.run().receipt,f.run().receipt)));
test('malformed receipt rejects',()=>fixture(f=>{f.run();fs.writeFileSync(path.join(f.dest,'receipt.json'),'{}');assert.throws(()=>f.run());}));
test('incomplete complete=true receipt rejects',()=>fixture(f=>{f.run();const file=path.join(f.dest,'receipt.json'),r=JSON.parse(fs.readFileSync(file));r.artifacts=[];fs.writeFileSync(file,JSON.stringify(r));assert.throws(()=>f.run());}));
test('concurrent or abandoned owner lock cannot be stolen',()=>fixture(f=>{f.run();fs.writeFileSync(path.join(f.dest,'.owner-lock'),'');assert.throws(()=>f.run());}));
test('production default rejects fewer than 132 references',()=>fixture(f=>{const o=f.options();delete o.expectedArtifacts;assert.throws(()=>prepareNpmCache(o));}));
test('network-disabled default has no acquisition path',()=>fixture(f=>{assert.equal(f.run().networkEnabled,false);const s=fs.readFileSync(new URL('./prepare-npm-cache.mjs',import.meta.url),'utf8');assert(!/fetch\(|https?\.request|child_process/.test(s));}));

test('cancellation after durable content prevents index publication and can resume',()=>fixture(f=>{const c=new AbortController(),original=fs.renameSync;fs.renameSync=(from,to)=>{const result=original(from,to);if(to.includes('/content-v2/'))c.abort();return result;};try{assert.throws(()=>f.run({signal:c.signal}));}finally{fs.renameSync=original;}assert(!fs.existsSync(path.join(f.dest,'cache/npm/_cacache',f.a.indexPath)));assert(f.run().receipt.complete);}));
test('changed lock fingerprint cannot reuse a destination',()=>fixture(f=>{f.run();f.pkg.optional=true;assert.throws(()=>f.run());}));
