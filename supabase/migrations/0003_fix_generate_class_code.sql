-- =============================================================================
-- Fix: generate_class_code dépendait de gen_random_bytes() de pgcrypto.
-- Sur les projets Supabase récents, pgcrypto vit dans le schéma `extensions`
-- et n'est pas dans le search_path par défaut des fonctions SECURITY DEFINER —
-- ce qui fait planter create_class avec :
--   function gen_random_bytes(integer) does not exist  (SQLSTATE 42883)
--
-- On reprend la fonction en utilisant uniquement des fonctions built-in
-- (md5 + random + clock_timestamp), suffisantes pour un code à 6 caractères.
-- =============================================================================

create or replace function public.generate_class_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(
      substring(
        md5(random()::text || clock_timestamp()::text)
        for 6
      )
    );
    select exists(select 1 from classes where code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;
