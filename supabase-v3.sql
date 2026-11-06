-- LEGIÓN DEL CAOS · Actualización 3 (stickers)
-- Ejecutar DESPUÉS de supabase-v2.sql (SQL Editor > New query > pegar > Run)
alter table messages add column if not exists kind text not null default 'texto';
