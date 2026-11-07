-- LEGIÓN DEL CAOS · Actualización 4 (tono de llamada, creador transferible)
-- Ejecutar DESPUÉS de supabase-v3.sql
alter table profiles add column if not exists tono text not null default 'clasico';

create or replace function public.guard_badges() returns trigger language plpgsql security definer set search_path=public as $$
declare me uuid := auth.uid(); d int[];
begin
 if me is null or new.badges is not distinct from old.badges then return new; end if;
 if not public.is_mod(me) then raise exception 'Solo moderadores pueden cambiar insignias'; end if;
 select coalesce(array_agg(x),'{}') into d from (
   (select unnest(new.badges) except select unnest(old.badges))
   union all
   (select unnest(old.badges) except select unnest(new.badges))) t(x);
 if 0=any(d) then
   if not public.is_creator(me) then raise exception 'Solo el creador puede dar o quitar el rango de creador'; end if;
   if new.id=me and not 0=any(new.badges) then raise exception 'No puedes quitarte a ti mismo el rango de creador'; end if;
 end if;
 if 1=any(d) and not public.is_creator(me) then raise exception 'Solo el creador puede dar o quitar moderación'; end if;
 if 6=any(d) and (1=any(new.badges) or 0=any(new.badges)) and not public.is_creator(me) then
   raise exception 'Solo el creador puede banear a un moderador';
 end if;
 if 6=any(new.badges) and not 6=any(old.badges) then
   new.banned_by := (select name from profiles where id=me);
 elsif not 6=any(new.badges) then
   new.banned_by := null;
 end if;
 return new;
end $$;
