-- LEGIÓN DEL CAOS · Actualización 2
-- Ejecutar DESPUÉS de supabase.sql (SQL Editor > New query > pegar > Run)

-- A) Teléfono y quién baneó
alter table profiles add column if not exists phone text unique;
alter table profiles add column if not exists banned_by text;

-- B) Configuración global: mantenimiento
create table if not exists app_config(
 id int primary key default 1 check (id=1),
 maintenance boolean not null default false,
 message text not null default ''
);
insert into app_config(id) values(1) on conflict do nothing;
alter table app_config enable row level security;
drop policy if exists "config leer" on app_config;
create policy "config leer" on app_config for select to anon, authenticated using (true);
drop policy if exists "config editar creador" on app_config;
create policy "config editar creador" on app_config for update to authenticated
 using (public.is_creator(auth.uid())) with check (public.is_creator(auth.uid()));

-- C) Puede usar la app: no está en mantenimiento (o es moderador) y no está baneado
create or replace function public.puede_usar() returns boolean language sql stable security definer set search_path=public as $$
 select (not exists(select 1 from app_config where id=1 and maintenance) or public.is_mod(auth.uid()))
    and not exists(select 1 from profiles where id=auth.uid() and 6=any(badges))
$$;

-- D) Protección de insignias (ahora incluye 6 = Baneado)
create or replace function public.guard_badges() returns trigger language plpgsql security definer set search_path=public as $$
declare me uuid := auth.uid(); d int[];
begin
 if me is null or new.badges is not distinct from old.badges then return new; end if;
 if not public.is_mod(me) then raise exception 'Solo moderadores pueden cambiar insignias'; end if;
 select coalesce(array_agg(x),'{}') into d from (
   (select unnest(new.badges) except select unnest(old.badges))
   union all
   (select unnest(old.badges) except select unnest(new.badges))) t(x);
 if 0=any(d) then raise exception 'La insignia de creador no se puede cambiar'; end if;
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

-- E) Reglas de acceso: en mantenimiento y para baneados, nadie excepto moderadores usa la app
drop policy if exists "perfiles leer" on profiles;
create policy "perfiles leer" on profiles for select to authenticated using (id=auth.uid() or public.puede_usar());
drop policy if exists "contactos propios" on contacts;
create policy "contactos propios" on contacts for all to authenticated
 using (owner=auth.uid() and public.puede_usar()) with check (owner=auth.uid() and public.puede_usar());
drop policy if exists "mensajes leer" on messages;
create policy "mensajes leer" on messages for select to authenticated
 using ((sender=auth.uid() or receiver=auth.uid()) and public.puede_usar());
drop policy if exists "mensajes enviar" on messages;
create policy "mensajes enviar" on messages for insert to authenticated
 with check (sender=auth.uid() and public.puede_usar());
drop policy if exists "estados vigentes" on statuses;
create policy "estados vigentes" on statuses for select to authenticated
 using (expires_at>now() and public.puede_usar());
drop policy if exists "estados publicar" on statuses;
create policy "estados publicar" on statuses for insert to authenticated
 with check (author=auth.uid() and public.puede_usar());
