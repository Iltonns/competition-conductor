-- Execute apos aplicar 20260718160000_phase1_atomic_matches_and_standings.sql.
-- Verificacoes estruturais que nao dependem de fixtures do ambiente remoto.
DO $$
BEGIN
  IF to_regprocedure('public.create_championship_match(uuid,uuid,uuid,timestamptz,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'phase1:create_championship_match_missing';
  END IF;
  IF to_regprocedure('public.record_match_event(uuid,uuid,uuid,uuid,uuid,public.event_type,integer,text,text)') IS NULL THEN
    RAISE EXCEPTION 'phase1:record_match_event_missing';
  END IF;
  IF to_regprocedure('public.remove_match_event(uuid,uuid,uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'phase1:remove_match_event_missing';
  END IF;
  IF to_regprocedure('public.recalculate_standings(uuid,uuid,uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'phase1:recalculate_standings_missing';
  END IF;
  IF to_regclass('public.standings') IS NULL OR to_regclass('public.audit_logs') IS NULL THEN
    RAISE EXCEPTION 'phase1:required_table_missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='match_events_client_request_unique') THEN
    RAISE EXCEPTION 'phase1:idempotency_index_missing';
  END IF;
  IF has_table_privilege('authenticated', 'public.matches', 'INSERT')
     OR has_table_privilege('authenticated', 'public.matches', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.match_events', 'DELETE') THEN
    RAISE EXCEPTION 'phase1:direct_mutation_privilege_detected';
  END IF;
END
$$;
