-- LEGIÓN DEL CAOS · Actualización 6 (info de contacto y grupo, encuestas de equipos)
-- Ejecutar DESPUÉS de supabase-v5.sql

-- Fecha de registro: se copia la real de cada cuenta
alter table profiles add column if not exists created_at timestamptz not null default now();
update profiles p set created_at=u.created_at from auth.users u where u.id=p.id;

-- Encuestas de equipos (cada encuesta es un mensaje del grupo)
create table if not exists encuestas(
 id bigint primary key references group_messages(id) on delete cascade,
 group_id uuid not null references groups(id) on delete cascade,
 texto text default '',
 cerrada boolean not null default false,
 created_at timestamptz default now()
);
create table if not exists escuadras(
 id bigint generated always as identity primary key,
 encuesta_id bigint not null references encuestas(id) on delete cascade,
 nombre text not null,
 orden int not null default 0
);
create table if not exists escuadra_miembros(
 encuesta_id bigint not null references encuestas(id) on delete cascade,
 user_id uuid not null references profiles(id) on delete cascade,
 escuadra_id bigint not null references escuadras(id) on delete cascade,
 unido_at timestamptz not null default now(),
 primary key(encuesta_id,user_id)
);

create or replace function public.grupo_de(e bigint) returns uuid language sql stable security definer set search_path=public as $$
 select group_id from encuestas where id=e
$$;

-- Reglas: máximo 4 por equipo; 5 minutos para cambiar desde la primera unión;
-- solo moderadores y creadores mueven, agregan o quitan a otros; encuesta cerrada = nadie cambia
create or replace function public.reglas_escuadra() returns trigger language plpgsql security definer set search_path=public as $$
declare me uuid := auth.uid(); eid bigint; g uuid; cer boolean; staff boolean; cnt int;
begin
 if me is null then
   if tg_op='DELETE' then return old; end if;
   return new;
 end if;
 if tg_op='DELETE' then eid:=old.encuesta_id; else eid:=new.encuesta_id; end if;
 select group_id,cerrada into g,cer from encuestas where id=eid;
 staff:=public.can_admin(g,me);
 if tg_op='DELETE' then
   if not staff and (old.user_id<>me or now()>old.unido_at+interval '5 minutes') then
     raise exception 'Ya no puedes salir de este equipo (pasaron 5 minutos)';
   end if;
   return old;
 end if;
 if cer and not staff then raise exception 'La encuesta ya está cerrada'; end if;
 if not staff and new.user_id<>me then raise exception 'Solo puedes unirte tú mismo'; end if;
 if tg_op='UPDATE' and new.escuadra_id is distinct from old.escuadra_id and not staff
    and now()>old.unido_at+interval '5 minutes' then
   raise exception 'Solo tienes 5 minutos para cambiar de equipo';
 end if;
 select count(*) into cnt from escuadra_miembros where escuadra_id=new.escuadra_id and user_id<>new.user_id;
 if cnt>=4 then raise exception 'Este equipo ya tiene 4 integrantes'; end if;
 return new;
end $$;
drop trigger if exists reglas_escuadra on escuadra_miembros;
create trigger reglas_escuadra before insert or update or delete on escuadra_miembros
 for each row execute function public.reglas_escuadra();

-- Seguridad (RLS)
alter table encuestas enable row level security;
alter table escuadras enable row level security;
alter table escuadra_miembros enable row level security;

drop policy if exists "enc ver" on encuestas;
create policy "enc ver" on encuestas for select to authenticated using (public.is_member(group_id,auth.uid()) and public.puede_usar());
drop policy if exists "enc crear" on encuestas;
create policy "enc crear" on encuestas for insert to authenticated with check (public.can_admin(group_id,auth.uid()) and public.puede_usar());
drop policy if exists "enc editar" on encuestas;
create policy "enc editar" on encuestas for update to authenticated using (public.can_admin(group_id,auth.uid())) with check (public.can_admin(group_id,auth.uid()));
drop policy if exists "enc borrar" on encuestas;
create policy "enc borrar" on encuestas for delete to authenticated using (public.can_admin(group_id,auth.uid()));

drop policy if exists "esq ver" on escuadras;
create policy "esq ver" on escuadras for select to authenticated using (public.is_member(public.grupo_de(encuesta_id),auth.uid()) and public.puede_usar());
drop policy if exists "esq admin" on escuadras;
create policy "esq admin" on escuadras for all to authenticated
 using (public.can_admin(public.grupo_de(encuesta_id),auth.uid())) with check (public.can_admin(public.grupo_de(encuesta_id),auth.uid()));

drop policy if exists "em ver" on escuadra_miembros;
create policy "em ver" on escuadra_miembros for select to authenticated using (public.is_member(public.grupo_de(encuesta_id),auth.uid()) and public.puede_usar());
drop policy if exists "em escribir" on escuadra_miembros;
create policy "em escribir" on escuadra_miembros for all to authenticated
 using ((user_id=auth.uid() or public.can_admin(public.grupo_de(encuesta_id),auth.uid())) and public.puede_usar())
 with check ((user_id=auth.uid() or public.can_admin(public.grupo_de(encuesta_id),auth.uid())) and public.is_member(public.grupo_de(encuesta_id),auth.uid()) and public.puede_usar());

-- Tiempo real (si sale "already a member", ignóralo)
alter publication supabase_realtime add table escuadra_miembros;
alter publication supabase_realtime add table encuestas;
