// Read-only verification of npm cacache v2 content / v5 indexes. No installer or network.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const hash = (bytes, algorithm='sha256', encoding='hex') => createHash(algorithm).update(bytes).digest(encoding);
const segments = hex => `${hex.slice(0,2)}/${hex.slice(2,4)}/${hex.slice(4)}`;
function safe(relative) {
  assert(typeof relative==='string' && relative.length<1024 && !relative.startsWith('/') && !/[\\\x00-\x20]/.test(relative));
  assert(relative.split('/').every(s=>s && s!=='.' && s!=='..'), 'Unsafe relative path');
  return relative;
}
function read(root, relative) {
  safe(relative); root=path.resolve(root);
  // Check every ancestor, not just the leaf, before opening any evidence.
  const full=path.join(root,relative); let current=path.parse(full).root;
  for(const part of full.slice(current.length).split('/')) {
    current=path.join(current,part);
    try { assert(!fs.lstatSync(current).isSymbolicLink(),'Symlinked evidence'); }
    catch(error) { if(error.code==='ENOENT')return null; throw error; }
  }
  const fd=fs.openSync(full,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  try { const s=fs.fstatSync(fd); assert(s.isFile() && s.size<=256*1024**2,'Invalid evidence file'); return fs.readFileSync(fd); }
  finally { fs.closeSync(fd); }
}
export function inventory(locks) {
  assert(Array.isArray(locks) && locks.length>0); const artifacts=new Map(), identities=new Set();
  const fingerprints=[];
  for(const {id,bytes,expectedSha256,packageName} of [...locks].sort((a,b)=>a.id.localeCompare(b.id))) {
    assert(typeof id==='string' && !identities.has(id));identities.add(id);
    assert(Buffer.isBuffer(bytes) && /^[a-f0-9]{64}$/.test(expectedSha256));
    assert.equal(hash(bytes),expectedSha256,'Lockfile fingerprint mismatch');
    const lock=JSON.parse(bytes);assert.equal(lock.lockfileVersion,3);
    assert.equal(lock.name,packageName);assert.equal(lock.packages[''].name,packageName);
    assert.equal(lock.version,lock.packages[''].version);
    fingerprints.push({id,sha256:hash(bytes)});
    for(const [location,pkg] of Object.entries(lock.packages).sort(([a],[b])=>a.localeCompare(b))) {
      if(!location)continue;safe(location);assert(location.startsWith('node_modules/'));
      assert(!pkg.link && typeof pkg.version==='string' && /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(pkg.version));
      assert(typeof pkg.resolved==='string');const url=new URL(pkg.resolved);
      assert(url.protocol==='https:' && url.host==='registry.npmjs.org' && !url.username && !url.password && !url.search && !url.hash,'Unapproved registry');
      assert.equal(url.href,pkg.resolved,'Noncanonical URL');
      assert(!/%|\\/.test(url.pathname) && !url.pathname.split('/').some(x=>x==='..'||x==='.'),'Unsafe artifact URL');
      assert(/^sha512-[A-Za-z0-9+/]{86}==$/.test(pkg.integrity),'Missing/corrupt SHA-512 integrity');
      const digest=Buffer.from(pkg.integrity.slice(7),'base64');assert.equal(digest.length,64);assert.equal(digest.toString('base64'),pkg.integrity.slice(7));
      const key='make-fetch-happen:request-cache:'+url.href;
      const expected={url:url.href,integrity:pkg.integrity,contentPath:'content-v2/sha512/'+segments(digest.toString('hex')),indexPath:'index-v5/'+segments(hash(key)),cacheKey:key};
      let artifact=artifacts.get(url.href);
      if(artifact)assert.equal(artifact.integrity,pkg.integrity,'Conflicting duplicate artifact');
      else { artifact={...expected,references:[]};artifacts.set(url.href,artifact); }
      artifact.references.push({lock:id,location,version:pkg.version,optional:pkg.optional===true,os:pkg.os??[],cpu:pkg.cpu??[]});
    }
  }
  return {locks:fingerprints,artifacts:[...artifacts.values()].sort((a,b)=>a.url.localeCompare(b.url))};
}
export function verifyOfflineNpm({locks,cacheRoot,artifactRoot,tarballs,strictCache=true}) {
  const plan=inventory(locks),verified=[],missing=[],allowed=new Set();
  if(artifactRoot)assert.deepEqual(Object.keys(tarballs??{}).sort(),plan.artifacts.map(a=>a.url).sort(),'Unexpected or missing tarball mapping');
  for(const a of plan.artifacts) {
    allowed.add(a.contentPath);allowed.add(a.indexPath);
    const reasons=[],blob=read(cacheRoot,a.contentPath),bucket=read(cacheRoot,a.indexPath);
    let digest=null;
    if(!blob)reasons.push('missing-blob');
    else {assert.equal('sha512-'+hash(blob,'sha512','base64'),a.integrity,'Artifact hash mismatch');digest={sha256:hash(blob),bytes:blob.length};}
    if(!bucket)reasons.push('missing-index');
    else {
      let latest;
      for(const line of bucket.toString('utf8').split('\n').filter(Boolean)) {
        const tab=line.indexOf('\t');assert(tab===40,'Malformed cache index');
        const data=line.slice(tab+1);assert.equal(hash(data,'sha1'),line.slice(0,tab),'Cache index checksum mismatch');
        const entry=JSON.parse(data);assert.equal(entry.key,a.cacheKey,'Unexpected cache index key');latest=entry;
      }
      if(!latest || latest.integrity===null)reasons.push('missing-index');
      else {assert.equal(latest.integrity,a.integrity,'Cache index integrity mismatch');assert(Number.isSafeInteger(latest.size)&&latest.size>=0,'Invalid cache size');if(blob)assert.equal(latest.size,blob.length,'Cache index size mismatch');}
    }
    if(artifactRoot) {
      const relative=safe(tarballs[a.url]);assert(relative.startsWith('tarballs/')); const bytes=read(artifactRoot,relative);
      if(!bytes)reasons.push('missing-tarball');else assert.equal('sha512-'+hash(bytes,'sha512','base64'),a.integrity,'Tarball substitution');
    }
    const record={...a,...(digest??{})};
    if(reasons.length)missing.push({...record,reasons});else verified.push(record);
  }
  if(strictCache) {
    function walk(relative='') {
      const dir=path.resolve(cacheRoot,relative);assert(!fs.lstatSync(dir).isSymbolicLink());
      for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
        const rel=relative?relative+'/'+entry.name:entry.name;assert(!entry.isSymbolicLink(),'Symlinked cache');
        if(entry.isDirectory())walk(rel);else assert(entry.isFile()&&allowed.has(rel),'Unexpected cache artifact');
      }
    }
    walk();
  }
  return {schemaVersion:'klm-offline-npm-inventory:v1',locks:plan.locks,requiredArtifacts:plan.artifacts.length,verified,missing,complete:missing.length===0,offlineInstallationVerified:false};
}
