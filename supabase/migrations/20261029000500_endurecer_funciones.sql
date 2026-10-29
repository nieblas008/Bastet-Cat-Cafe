-- Ajustes del linter de seguridad de Supabase.
-- 1) search_path fijo en las funciones de trigger.
-- 2) Las funciones de trigger no se pueden llamar por la API (/rest/v1/rpc).
--    Los triggers siguen funcionando igual: no dependen de EXECUTE del rol.
-- Las funciones is_staff/is_admin/sponsors_cat/current_role_name sí quedan
-- ejecutables porque las reglas de acceso (RLS) las usan; solo devuelven
-- información sobre la propia sesión. sponsor_wall y cat_sponsor_counts son
-- públicas a propósito (solo devuelven lo que el padrino aceptó mostrar).

alter function public.set_updated_at() set search_path = public;
alter function public.posts_publish_date() set search_path = public;
alter function public.adopters_default_next() set search_path = public;

revoke execute on function
  public.set_updated_at(),
  public.posts_publish_date(),
  public.adopters_default_next(),
  public.cats_status_side_effects(),
  public.followup_schedule_next(),
  public.handle_new_user(),
  public.protect_profile_role(),
  public.log_change()
from public, anon, authenticated;
