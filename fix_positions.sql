-- 1) Alle Positions-Elemente „entpacken“ und auf {Abwehr,Zuspiel,Angriff} normalisieren
with src as (
  select user_id, unnest(position) as elem
  from public.profiles
  where position is not null
),
norm as (
  -- äußere Anführungszeichen entfernen
  select user_id, regexp_replace(elem::text, '^"(.*)"$', '\1') as elem
  from src
),
flat as (
  -- (a) JSON-Array im Element: ["Abwehr","Zuspiel"]
  select user_id, json_array_elements_text(elem::json) as val
  from norm
  where elem like '[%' and elem like '%]'

  union all

  -- (b) Postgres-Arrayliteral im Element: {Abwehr,Zuspiel}
  select user_id, unnest(elem::text[]) as val
  from norm
  where elem like '{%' and elem like '%}'

  union all

  -- (c) einfacher Wert
  select user_id, elem as val
  from norm
  where not ( (elem like '[%' and elem like '%]') or (elem like '{%' and elem like '%}') )
),
mapped as (
  select user_id,
         case lower(btrim(val))
           when 'abwehr'  then 'Abwehr'
           when 'zuspiel' then 'Zuspiel'
           when 'angriff' then 'Angriff'
           else null
         end as m
  from flat
),
rollup as (
  select user_id,
         case when count(m) = 0 then null
              else array_agg(distinct m order by m) end as arr
  from mapped
  where m is not null
  group by user_id
)
update public.profiles p
set position = r.arr
from rollup r
where p.user_id = r.user_id;

-- 2) Constraint setzen (nur Abwehr/Zuspiel/Angriff erlaubt)
alter table public.profiles drop constraint if exists profiles_position_allowed_chk;
alter table public.profiles
  add constraint profiles_position_allowed_chk
  check (position is null or position <@ array['Abwehr','Zuspiel','Angriff']::text[]);

-- 3) Schnellcheck (optional ansehen)
-- select user_id, position, array_to_string(position, ', ') as pretty
-- from public.profiles order by 1 limit 50;
