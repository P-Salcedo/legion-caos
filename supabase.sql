-- LEGIÓN DEL CAOS · Pega TODO esto en Supabase > SQL Editor > Run

-- 1. Perfiles
create table if not exists profiles(
 id uuid primary key references auth.users on delete cascade,
 username text unique not null,
 name text not null,
 about text default 'Caos es mi estilo ⚔️',
 photo text default '',
 badges int[] not null default '{}'
);

-- 2. Moderadores: al registrarse con estos nombres reciben su insignia
create table if not exists mod_seed(username text primary key, badges int[] not null);
insert into mod_seed values
 (lower('ᶫᶜ ᭄pitbull√'),'{1}'),
 (lower('ᶫᶜ༉Luli♡'),'{1}'),
 (lower('ALE'),'{1}'),
 (lower('Kirito'),'{1,0}'),
 (lower('Kevin'),'{1}'),
 (lower('༄•Lo✓e☯⵿ Bel™'),'{1}')
on conflict do nothing;

-- 3. Crear el perfil automáticamente al registrarse
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare u text := lower(coalesce(new.raw_user_meta_data->>'username',''));
begin
 insert into public.profiles(id,username,name,badges)
 values(new.id,u,coalesce(new.raw_user_meta_data->>'name',u),coalesce((select badges from public.mod_seed where username=u),'{}'));
 return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 4. Permisos
create or replace function public.is_mod(u uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where id=u and (0=any(badges) or 1=any(badges)))
$$;
create or replace function public.is_creator(u uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where id=u and 0=any(badges))
$$;

-- 5. Protección de insignias: solo moderadores, y la moderación solo la da el creador
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
 return new;
end $$;
drop trigger if exists guard_badges on profiles;
create trigger guard_badges before update on profiles for each row execute function public.guard_badges();

-- 6. Tablas de la app
create table if not exists contacts(
 owner uuid references profiles(id) on delete cascade,
 friend uuid references profiles(id) on delete cascade,
 nickname text,
 bg text default 'fuego',
 primary key(owner,friend)
);
create table if not exists messages(
 id bigint generated always as identity primary key,
 sender uuid references profiles(id) on delete cascade,
 receiver uuid references profiles(id) on delete cascade,
 body text,
 img text,
 created_at timestamptz default now()
);
create table if not exists statuses(
 id bigint generated always as identity primary key,
 author uuid references profiles(id) on delete cascade,
 body text not null,
 created_at timestamptz default now(),
 expires_at timestamptz default now() + interval '24 hours'
);

-- 7. Al recibir un mensaje, el destinatario tiene el chat automáticamente
create or replace function public.auto_contact() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into contacts(owner,friend,nickname)
 values(new.receiver,new.sender,(select name from profiles where id=new.sender))
 on conflict do nothing;
 return new;
end $$;
drop trigger if exists auto_contact on messages;
create trigger auto_contact after insert on messages for each row execute function public.auto_contact();

-- 8. Seguridad (RLS): cada persona solo ve lo que le corresponde
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table messages enable row level security;
alter table statuses enable row level security;
alter table mod_seed enable row level security;

drop policy if exists "perfiles leer" on profiles;
create policy "perfiles leer" on profiles for select to authenticated using (true);
drop policy if exists "perfiles editar" on profiles;
create policy "perfiles editar" on profiles for update to authenticated
 using (id=auth.uid() or public.is_mod(auth.uid())) with check (id=auth.uid() or public.is_mod(auth.uid()));
drop policy if exists "contactos propios" on contacts;
create policy "contactos propios" on contacts for all to authenticated using (owner=auth.uid()) with check (owner=auth.uid());
drop policy if exists "mensajes leer" on messages;
create policy "mensajes leer" on messages for select to authenticated using (sender=auth.uid() or receiver=auth.uid());
drop policy if exists "mensajes enviar" on messages;
create policy "mensajes enviar" on messages for insert to authenticated with check (sender=auth.uid());
drop policy if exists "estados vigentes" on statuses;
create policy "estados vigentes" on statuses for select to authenticated using (expires_at>now());
drop policy if exists "estados publicar" on statuses;
create policy "estados publicar" on statuses for insert to authenticated with check (author=auth.uid());
drop policy if exists "estados borrar" on statuses;
create policy "estados borrar" on statuses for delete to authenticated using (author=auth.uid() or public.is_mod(auth.uid()));

-- 9. Mensajes en tiempo real (si sale "already a member", ignóralo)
alter publication supabase_realtime add table messages;

-- 10. (Opcional) borrar estados vencidos de la base cada hora.
-- Quita los guiones de las dos líneas siguientes si quieres activarlo:
-- create extension if not exists pg_cron;
-- select cron.schedule('borrar-estados','0 * * * *','delete from public.statuses where expires_at < now()');
