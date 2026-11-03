-- NEW reviewed SQL source, not an applied migration or an existing Supabase schema.
-- Execute only under separately approved installation. No roles, login bindings,
-- grants to runtime identities, initial trust, or initial history are provisioned.
BEGIN;
CREATE SCHEMA klm_acquisition_witness;
REVOKE ALL ON SCHEMA klm_acquisition_witness FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA klm_acquisition_witness REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA klm_acquisition_witness REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE TABLE klm_acquisition_witness.principals (
 authority_id text NOT NULL CHECK (authority_id ~ '^npm-artifact-acquisition:[a-z0-9][a-z0-9-]{0,63}$'),
 capability text NOT NULL CHECK (capability IN ('worker','curator','recovery','checkpoint')),
 database_login name NOT NULL,
 subject text NOT NULL CHECK (length(subject) BETWEEN 1 AND 256),
 PRIMARY KEY (authority_id,capability), UNIQUE (authority_id,database_login), UNIQUE (authority_id,subject)
);
CREATE TABLE klm_acquisition_witness.approved_generations (
 authority_id text NOT NULL,
 generation bigint NOT NULL CHECK (generation BETWEEN 1 AND 9007199254740991),
 state_doc jsonb NOT NULL,
 source_revision text NOT NULL CHECK (source_revision ~ '^[a-f0-9]{64}$'),
 approved_by text NOT NULL,
 approved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY (authority_id,generation)
);
CREATE TABLE klm_acquisition_witness.history (
 authority_id text NOT NULL,
 generation bigint NOT NULL CHECK (generation BETWEEN 1 AND 9007199254740991),
 previous_generation bigint,
 witness_digest text NOT NULL CHECK (witness_digest ~ '^[a-f0-9]{64}$'),
 configuration_fingerprint text NOT NULL CHECK (configuration_fingerprint ~ '^[a-f0-9]{64}$'),
 transaction_id text NOT NULL UNIQUE CHECK (transaction_id ~ '^[a-f0-9]{64}$'),
 commit_state text NOT NULL DEFAULT 'committed' CHECK (commit_state = 'committed'),
 audit_sequence bigint NOT NULL CHECK (audit_sequence BETWEEN 1 AND 9007199254740991),
 audit_digest text NOT NULL CHECK (audit_digest ~ '^[a-f0-9]{64}$'),
 entry_text text NOT NULL CHECK (octet_length(entry_text) <= 16384),
 audit_text text NOT NULL CHECK (octet_length(audit_text) <= 16384),
 actor text NOT NULL,
 committed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY (authority_id,generation), UNIQUE (authority_id,audit_sequence), UNIQUE (authority_id,witness_digest),
 FOREIGN KEY (authority_id,generation) REFERENCES klm_acquisition_witness.approved_generations(authority_id,generation),
 FOREIGN KEY (authority_id,previous_generation) REFERENCES klm_acquisition_witness.history(authority_id,generation),
 CHECK (previous_generation IS NULL OR previous_generation < generation)
);
CREATE TABLE klm_acquisition_witness.heads (
 authority_id text PRIMARY KEY,
 generation bigint NOT NULL,
 FOREIGN KEY (authority_id,generation) REFERENCES klm_acquisition_witness.history(authority_id,generation)
);
ALTER TABLE klm_acquisition_witness.principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE klm_acquisition_witness.approved_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE klm_acquisition_witness.history ENABLE ROW LEVEL SECURITY;
ALTER TABLE klm_acquisition_witness.heads ENABLE ROW LEVEL SECURITY;
-- No permissive RLS policy. Runtime receives function-only privileges after review.
REVOKE ALL ON ALL TABLES IN SCHEMA klm_acquisition_witness FROM PUBLIC;

CREATE FUNCTION klm_acquisition_witness.digest_text(value text) RETURNS text
 LANGUAGE sql IMMUTABLE STRICT SET search_path = pg_catalog, pg_temp
 AS $$ SELECT encode(sha256(convert_to(value,'UTF8')),'hex') $$;
CREATE FUNCTION klm_acquisition_witness.immutable_record() RETURNS trigger
 LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
 BEGIN RAISE EXCEPTION 'immutable witness evidence' USING ERRCODE='42501'; END $$;
CREATE TRIGGER history_immutable BEFORE UPDATE OR DELETE ON klm_acquisition_witness.history
 FOR EACH ROW EXECUTE FUNCTION klm_acquisition_witness.immutable_record();
CREATE TRIGGER history_no_truncate BEFORE TRUNCATE ON klm_acquisition_witness.history
 FOR EACH STATEMENT EXECUTE FUNCTION klm_acquisition_witness.immutable_record();
CREATE TRIGGER approvals_immutable BEFORE UPDATE OR DELETE ON klm_acquisition_witness.approved_generations
 FOR EACH ROW EXECUTE FUNCTION klm_acquisition_witness.immutable_record();
CREATE TRIGGER approvals_no_truncate BEFORE TRUNCATE ON klm_acquisition_witness.approved_generations
 FOR EACH STATEMENT EXECUTE FUNCTION klm_acquisition_witness.immutable_record();

-- Deliberate private SECURITY DEFINER boundary: runtime has no direct DML rights.
-- Installation must use a restricted NOLOGIN function owner, not a runtime login.
-- session_user is the authenticated DB login, unaffected by caller SET ROLE/GUCs.
CREATE FUNCTION klm_acquisition_witness.require_principal(a text, c text) RETURNS text
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
 DECLARE who text;
 BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=session_user AND (rolsuper OR rolbypassrls)) THEN
   RAISE EXCEPTION 'privileged runtime login prohibited' USING ERRCODE='42501';
  END IF;
  SELECT subject INTO who FROM klm_acquisition_witness.principals
   WHERE authority_id=a AND capability=c AND database_login=session_user FOR SHARE;
  IF who IS NULL THEN RAISE EXCEPTION 'database identity unauthorized' USING ERRCODE='42501'; END IF;
  RETURN who;
 END $$;
CREATE FUNCTION klm_acquisition_witness.validate_state(a text, s jsonb) RETURNS void
 LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
 BEGIN
  IF (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(s) k) IS DISTINCT FROM
   ARRAY['configurationSha256','domain','environment','generation','notAfter','notBefore','rootSpkiSha256','trustId']::text[]
   OR s->>'domain' IS DISTINCT FROM 'npm-artifact-acquisition' OR s->>'environment' IS DISTINCT FROM 'production'
   OR a IS DISTINCT FROM (s->>'domain')||':'||(s->>'trustId')
   OR jsonb_typeof(s->'trustId') IS DISTINCT FROM 'string'
   OR jsonb_typeof(s->'configurationSha256') IS DISTINCT FROM 'string' OR jsonb_typeof(s->'rootSpkiSha256') IS DISTINCT FROM 'string'
   OR (s->>'trustId') !~ '^[a-z0-9][a-z0-9-]{0,63}$'
   OR (s->>'configurationSha256') !~ '^[a-f0-9]{64}$' OR (s->>'rootSpkiSha256') !~ '^[a-f0-9]{64}$'
   OR jsonb_typeof(s->'generation') IS DISTINCT FROM 'number' OR (s->>'generation')::bigint NOT BETWEEN 1 AND 9007199254740991
   OR jsonb_typeof(s->'notBefore') IS DISTINCT FROM 'number' OR jsonb_typeof(s->'notAfter') IS DISTINCT FROM 'number'
   OR (s->>'notBefore')::bigint <= 0 OR (s->>'notAfter')::bigint <= (s->>'notBefore')::bigint THEN
   RAISE EXCEPTION 'invalid approved state' USING ERRCODE='22023';
  END IF;
 END $$;
CREATE FUNCTION klm_acquisition_witness.snapshot(a text, g bigint) RETURNS json
 LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
 SELECT json_build_object('state',(h.entry_text::jsonb->'state')||jsonb_build_object(
  'initialized',true,'head',h.witness_digest,'auditSequence',h.audit_sequence,'auditSha256',h.audit_digest),
  'audit',h.audit_text::json,'observedAt',floor(extract(epoch FROM clock_timestamp())*1000)::bigint)
 FROM klm_acquisition_witness.history h WHERE h.authority_id=a AND h.generation=g
 $$;
CREATE FUNCTION klm_acquisition_witness.approve_generation(a text, s jsonb, revision text) RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
 DECLARE who text;
 BEGIN
  who:=klm_acquisition_witness.require_principal(a,'curator');PERFORM klm_acquisition_witness.validate_state(a,s);
  IF revision IS DISTINCT FROM s->>'configurationSha256' THEN RAISE EXCEPTION 'source revision mismatch' USING ERRCODE='22023'; END IF;
  INSERT INTO klm_acquisition_witness.approved_generations(authority_id,generation,state_doc,source_revision,approved_by)
   VALUES(a,(s->>'generation')::bigint,s,revision,who);
 END $$;
CREATE FUNCTION klm_acquisition_witness.read_snapshot(a text) RETURNS json
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
 DECLARE g bigint;
 BEGIN
  PERFORM klm_acquisition_witness.require_principal(a,'worker');
  SELECT generation INTO g FROM klm_acquisition_witness.heads WHERE authority_id=a FOR UPDATE;
  IF g IS NULL THEN RAISE EXCEPTION 'missing witness history' USING ERRCODE='22023'; END IF;
  RETURN klm_acquisition_witness.snapshot(a,g);
 END $$;

-- Internal operation. It never validates or creates independent checkpoints.
-- Service-side signature verification is mandatory before/after DB admission.
CREATE FUNCTION klm_acquisition_witness.write_transition(
 a text, expected_generation bigint, expected_head text, expected_sequence bigint, expected_audit text,
 entry_bytes text, audit_bytes text, tx text, initial boolean) RETURNS json
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
 DECLARE who text; e jsonb; s jsonb; audit jsonb; prior jsonb; g bigint; next_g bigint;
  next_head text; next_sequence bigint; approved klm_acquisition_witness.approved_generations%ROWTYPE;
 BEGIN
  who:=klm_acquisition_witness.require_principal(a,CASE WHEN initial THEN 'curator' ELSE 'worker' END);
  IF octet_length(entry_bytes)>16384 OR octet_length(audit_bytes)>16384 THEN RAISE EXCEPTION 'oversized evidence' USING ERRCODE='22023'; END IF;
  e:=entry_bytes::jsonb;s:=e->'state';audit:=audit_bytes::jsonb;PERFORM klm_acquisition_witness.validate_state(a,s);
  next_g:=(s->>'generation')::bigint;next_head:=klm_acquisition_witness.digest_text(entry_bytes);
  IF (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(e) k) IS DISTINCT FROM ARRAY['authentication','previous','schemaVersion','sequence','sourceRevision','state']::text[]
   OR jsonb_typeof(e->'authentication') IS DISTINCT FROM 'string'
   OR jsonb_typeof(e->'sequence') IS DISTINCT FROM 'number' OR (e->>'sequence')::bigint NOT BETWEEN 0 AND 999
   OR e->>'schemaVersion' IS DISTINCT FROM 'klm-acquisition-rotation:v1' OR (e->>'authentication') !~ '^[a-f0-9]{64}$'
   OR tx IS DISTINCT FROM klm_acquisition_witness.digest_text('klm-acquisition-transition:v1'||chr(10)||a||chr(10)||next_head) THEN
   RAISE EXCEPTION 'invalid transition identity' USING ERRCODE='22023';
  END IF;
  SELECT * INTO approved FROM klm_acquisition_witness.approved_generations WHERE authority_id=a AND generation=next_g FOR SHARE;
  IF NOT FOUND OR approved.state_doc IS DISTINCT FROM s OR approved.source_revision IS DISTINCT FROM e->>'sourceRevision' THEN
   RAISE EXCEPTION 'generation not independently approved' USING ERRCODE='42501';
  END IF;
  SELECT generation INTO g FROM klm_acquisition_witness.heads WHERE authority_id=a FOR UPDATE;
  IF initial THEN
   IF g IS NOT NULL OR expected_generation IS DISTINCT FROM 0 OR expected_head IS NOT NULL OR expected_sequence IS DISTINCT FROM 0 OR expected_audit IS NOT NULL OR e->'previous' IS DISTINCT FROM 'null'::jsonb THEN
    RAISE EXCEPTION 'initialization cannot reset history' USING ERRCODE='23505';
   END IF;
   next_sequence:=1;
  ELSE
   IF g IS NULL OR g IS DISTINCT FROM expected_generation THEN RAISE EXCEPTION 'stale generation' USING ERRCODE='40001'; END IF;
   prior:=klm_acquisition_witness.snapshot(a,g);
   IF prior->'state'->>'head' IS DISTINCT FROM expected_head OR (prior->'state'->>'auditSequence')::bigint IS DISTINCT FROM expected_sequence
    OR prior->'state'->>'auditSha256' IS DISTINCT FROM expected_audit OR e->>'previous' IS DISTINCT FROM expected_head
    OR next_g<=g OR (s->>'notBefore')::bigint < (prior->'state'->>'notBefore')::bigint THEN
    RAISE EXCEPTION 'compare and swap conflict' USING ERRCODE='40001';
   END IF;
   next_sequence:=expected_sequence+1;
  END IF;
  IF audit IS DISTINCT FROM jsonb_build_object('domain',s->>'domain','trustId',s->>'trustId','sequence',next_sequence,
   'generation',next_g,'head',next_head,'previousHead',expected_head,'previousAuditSha256',expected_audit,
   'configurationSha256',s->>'configurationSha256','rootSpkiSha256',s->>'rootSpkiSha256','actor',who,'operation','advance') THEN
   RAISE EXCEPTION 'audit binding mismatch' USING ERRCODE='22023';
  END IF;
  INSERT INTO klm_acquisition_witness.history(authority_id,generation,previous_generation,witness_digest,configuration_fingerprint,
   transaction_id,audit_sequence,audit_digest,entry_text,audit_text,actor)
  VALUES(a,next_g,g,next_head,s->>'configurationSha256',tx,next_sequence,klm_acquisition_witness.digest_text(audit_bytes),entry_bytes,audit_bytes,who);
  IF initial THEN INSERT INTO klm_acquisition_witness.heads VALUES(a,next_g);
  ELSE UPDATE klm_acquisition_witness.heads SET generation=next_g WHERE authority_id=a AND generation=expected_generation;
   IF NOT FOUND THEN RAISE EXCEPTION 'compare and swap conflict' USING ERRCODE='40001'; END IF;
  END IF;
  RETURN klm_acquisition_witness.snapshot(a,next_g);
 END $$;
CREATE FUNCTION klm_acquisition_witness.compare_and_swap(a text,g bigint,h text,s bigint,d text,e text,u text,t text) RETURNS json
 LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
 SELECT klm_acquisition_witness.write_transition(a,g,h,s,d,e,u,t,false) $$;
CREATE FUNCTION klm_acquisition_witness.initialize(a text,e text,u text,t text) RETURNS json
 LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
 SELECT klm_acquisition_witness.write_transition(a,0,NULL,0,NULL,e,u,t,true) $$;
CREATE FUNCTION klm_acquisition_witness.confirm_transition(a text,t text) RETURNS json
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
 DECLARE g bigint;
 BEGIN
  PERFORM klm_acquisition_witness.require_principal(a,'worker');
  SELECT generation INTO g FROM klm_acquisition_witness.history WHERE authority_id=a AND transaction_id=t AND commit_state='committed';
  IF g IS NULL THEN RAISE EXCEPTION 'durable transaction not confirmed' USING ERRCODE='22023'; END IF;
  RETURN klm_acquisition_witness.snapshot(a,g);
 END $$;
-- Default deny: a later reviewed provisioning step must grant ONLY schema USAGE
-- and exact wrapper EXECUTE to separate bound DB logins, never table DML, helper
-- EXECUTE, schema CREATE, owner membership, or shared authenticator credentials.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA klm_acquisition_witness FROM PUBLIC;
COMMIT;
