-- LEGIÓN DEL CAOS · Actualización 5 (grupos y Clan Legión Caos)
-- Ejecutar DESPUÉS de supabase-v4.sql

create table if not exists groups(
 id uuid primary key default gen_random_uuid(),
 name text not null,
 categoria text not null default 'solo',
 clan boolean not null default false,
 owner uuid references profiles(id) on delete set null,
 photo text default '',
 color text default '#8e24aa',
 permiso_mensajes text not null default 'todos',
 permiso_nombre text not null default 'admins',
 permiso_foto text not null default 'admins',
 created_at timestamptz default now()
);
create table if not exists group_members(
 group_id uuid references groups(id) on delete cascade,
 user_id uuid references profiles(id) on delete cascade,
 primary key(group_id,user_id)
);
create table if not exists group_messages(
 id bigint generated always as identity primary key,
 group_id uuid references groups(id) on delete cascade,
 sender uuid references profiles(id) on delete cascade,
 body text,
 img text,
 kind text not null default 'texto',
 created_at timestamptz default now()
);

-- Categoría de grupo -> insignia que da acceso automático
create or replace function public.badge_de(cat text) returns int language sql immutable as $$
 select case cat when 'creadores' then 0 when 'moderadores' then 1 when 'creador_contenido' then 2 when 'patrocinador' then 3 when 'veterano' then 5 end
$$;

create or replace function public.is_member(g uuid, u uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from group_members where group_id=g and user_id=u)
$$;
create or replace function public.can_admin(g uuid, u uuid) returns boolean language sql stable security definer set search_path=public as $$
 select public.is_mod(u) or exists(select 1 from groups where id=g and owner=u)
$$;
create or replace function public.can_post(g uuid, u uuid) returns boolean language sql stable security definer set search_path=public as $$
 select public.is_member(g,u) and (public.can_admin(g,u) or exists(select 1 from groups where id=g and permiso_mensajes='todos'))
$$;

-- Miembros automáticos: el Clan incluye a todos; los grupos de rango, a quien tenga la insignia
create or replace function public.sync_profile_groups() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into group_members(group_id,user_id) select g.id,new.id from groups g where g.clan on conflict do nothing;
 delete from group_members gm using groups g
  where gm.group_id=g.id and gm.user_id=new.id and not g.clan and public.badge_de(g.categoria) is not null
    and not (public.badge_de(g.categoria)=any(new.badges));
 insert into group_members(group_id,user_id) select g.id,new.id from groups g
  where not g.clan and public.badge_de(g.categoria)=any(new.badges) on conflict do nothing;
 return new;
end $$;
drop trigger if exists sync_groups on profiles;
create trigger sync_groups after insert or update of badges on profiles for each row execute function public.sync_profile_groups();

create or replace function public.sync_group_members() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.clan then
   insert into group_members select new.id,p.id from profiles p on conflict do nothing;
 elsif public.badge_de(new.categoria) is not null then
   insert into group_members select new.id,p.id from profiles p where public.badge_de(new.categoria)=any(p.badges) on conflict do nothing;
 end if;
 if new.owner is not null then insert into group_members values(new.id,new.owner) on conflict do nothing; end if;
 return new;
end $$;
drop trigger if exists groups_members on groups;
create trigger groups_members after insert on groups for each row execute function public.sync_group_members();

-- Clan Legión Caos (se crea una sola vez y mete a todos los usuarios, nuevos y antiguos)
insert into groups(name,categoria,clan,owner,color)
select 'Clan Legión Caos','clan',true,null,'#ffb300'
where not exists(select 1 from groups where clan);

-- Solo administradores (moderadores, creadores y dueño del grupo) cambian ajustes.
-- Los demás miembros solo cambian nombre o foto si el grupo lo permite.
create or replace function public.guard_group() returns trigger language plpgsql security definer set search_path=public as $$
declare me uuid := auth.uid();
begin
 if me is null or public.can_admin(old.id,me) then return new; end if;
 if new.permiso_mensajes is distinct from old.permiso_mensajes or new.permiso_nombre is distinct from old.permiso_nombre
    or new.permiso_foto is distinct from old.permiso_foto or new.categoria is distinct from old.categoria
    or new.owner is distinct from old.owner or new.clan is distinct from old.clan then
   raise exception 'Solo los administradores del grupo pueden cambiar sus ajustes';
 end if;
 if new.name is distinct from old.name and old.permiso_nombre='admins' then raise exception 'Solo los administradores pueden cambiar el nombre'; end if;
 if new.photo is distinct from old.photo and old.permiso_foto='admins' then raise exception 'Solo los administradores pueden cambiar la foto'; end if;
 return new;
end $$;
drop trigger if exists guard_group on groups;
create trigger guard_group before update on groups for each row execute function public.guard_group();

-- Seguridad (RLS)
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_messages enable row level security;

drop policy if exists "grupos ver" on groups;
create policy "grupos ver" on groups for select to authenticated
 using ((public.is_member(id,auth.uid()) or public.is_mod(auth.uid())) and public.puede_usar());
drop policy if exists "grupos crear" on groups;
create policy "grupos crear" on groups for insert to authenticated
 with check (owner=auth.uid() and clan=false and public.puede_usar());
drop policy if exists "grupos editar" on groups;
create policy "grupos editar" on groups for update to authenticated
 using ((public.is_member(id,auth.uid()) or public.can_admin(id,auth.uid())) and public.puede_usar())
 with check ((public.is_member(id,auth.uid()) or public.can_admin(id,auth.uid())) and public.puede_usar());
drop policy if exists "grupos borrar" on groups;
create policy "grupos borrar" on groups for delete to authenticated
 using (public.can_admin(id,auth.uid()) and clan=false and public.puede_usar());

drop policy if exists "miembros ver" on group_members;
create policy "miembros ver" on group_members for select to authenticated
 using ((public.is_member(group_id,auth.uid()) or public.is_mod(auth.uid())) and public.puede_usar());
drop policy if exists "miembros agregar" on group_members;
create policy "miembros agregar" on group_members for insert to authenticated
 with check (public.can_admin(group_id,auth.uid()) and public.puede_usar());
drop policy if exists "miembros salir" on group_members;
create policy "miembros salir" on group_members for delete to authenticated
 using (((user_id=auth.uid() and not exists(select 1 from groups g where g.id=group_id and g.clan)) or public.can_admin(group_id,auth.uid())) and public.puede_usar());

drop policy if exists "gm ver" on group_messages;
create policy "gm ver" on group_messages for select to authenticated
 using (public.is_member(group_id,auth.uid()) and public.puede_usar());
drop policy if exists "gm enviar" on group_messages;
create policy "gm enviar" on group_messages for insert to authenticated
 with check (sender=auth.uid() and public.can_post(group_id,auth.uid()) and public.puede_usar());

-- Tiempo real (si sale "already a member", ignóralo)
alter publication supabase_realtime add table group_messages;
alter publication supabase_realtime add table groups;
