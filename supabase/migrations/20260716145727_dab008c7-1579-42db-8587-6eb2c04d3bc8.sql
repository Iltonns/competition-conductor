
REVOKE EXECUTE ON FUNCTION public.register_athlete_for_championship(uuid,uuid,text,date,text,text,text,integer,text,boolean,boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.add_team_staff_for_championship(uuid,uuid,text,text,text,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.add_team_responsible(uuid,uuid,text,text,text,text,boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.register_athlete_for_championship(uuid,uuid,text,date,text,text,text,integer,text,boolean,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_team_staff_for_championship(uuid,uuid,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_team_responsible(uuid,uuid,text,text,text,text,boolean) TO authenticated;
