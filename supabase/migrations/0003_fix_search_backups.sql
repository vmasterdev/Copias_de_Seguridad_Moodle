create or replace function public.search_backups(
  p_search text default null,
  p_category text default null,
  p_rectoria text default null,
  p_sede text default null,
  p_program_code text default null,
  p_period text default null,
  p_year integer default null,
  p_page integer default 1,
  p_page_size integer default 20,
  p_similarity_threshold numeric default 0.2
) returns jsonb
language plpgsql
stable
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_category text := nullif(trim(coalesce(p_category, '')), '');
  v_rectoria text := nullif(trim(coalesce(p_rectoria, '')), '');
  v_sede text := nullif(trim(coalesce(p_sede, '')), '');
  v_program_code text := nullif(trim(coalesce(p_program_code, '')), '');
  v_period text := nullif(trim(coalesce(p_period, '')), '');
  v_page integer := greatest(p_page, 1);
  v_page_size integer := greatest(least(p_page_size, 100), 1);
  result jsonb;
begin
  with filtered as (
    select b.*,
      case
        when v_search is null then 0
        else similarity(b.file_name, v_search)
      end as score
    from public.backups b
    where (v_search is null
        or similarity(b.file_name, v_search) >= p_similarity_threshold
        or b.file_name ilike '%' || v_search || '%'
        or b.program_name ilike '%' || v_search || '%'
        or b.program_code ilike '%' || v_search || '%')
      and (v_category is null or b.category = v_category)
      and (v_rectoria is null or lower(b.rectoria) = lower(v_rectoria))
      and (v_sede is null or lower(b.sede) = lower(v_sede))
      and (v_program_code is null or b.program_code = v_program_code)
      and (v_period is null or b.period = v_period)
      and (p_year is null or b.year = p_year)
  ), paginated as (
    select
      id,
      file_name,
      category,
      program_code,
      program_name,
      rectoria,
      sede,
      period,
      year,
      size_bytes,
      checksum,
      storage_key,
      created_by,
      created_at
    from filtered
    order by
      case when v_search is null then 0 else 1 end desc,
      score desc,
      created_at desc
    limit v_page_size offset (v_page - 1) * v_page_size
  ), categories as (
    select category as value, count(*)::int as count
    from filtered
    group by category
    order by count desc
  ), rectorias as (
    select rectoria as value, count(*)::int as count
    from filtered
    where rectoria is not null
    group by rectoria
    order by count desc
  ), sedes as (
    select sede as value, count(*)::int as count
    from filtered
    where sede is not null
    group by sede
    order by count desc
  ), periods as (
    select period as value, count(*)::int as count
    from filtered
    where period is not null
    group by period
    order by count desc
  ), programs as (
    select program_code as value, max(program_name) as label, count(*)::int as count
    from filtered
    group by program_code
    order by count desc
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(to_jsonb(p)) from paginated p), '[]'::jsonb),
    'total', (select count(*) from filtered),
    'facets', jsonb_build_object(
      'categories', coalesce((select jsonb_agg(jsonb_build_object('value', value, 'count', count)) from categories), '[]'::jsonb),
      'rectorias', coalesce((select jsonb_agg(jsonb_build_object('value', value, 'count', count)) from rectorias), '[]'::jsonb),
      'sedes', coalesce((select jsonb_agg(jsonb_build_object('value', value, 'count', count)) from sedes), '[]'::jsonb),
      'periods', coalesce((select jsonb_agg(jsonb_build_object('value', value, 'count', count)) from periods), '[]'::jsonb),
      'programs', coalesce((select jsonb_agg(jsonb_build_object('value', value, 'label', label, 'count', count)) from programs), '[]'::jsonb)
    )
  ) into result;

  return coalesce(result, jsonb_build_object(
    'items', '[]'::jsonb,
    'total', 0,
    'facets', jsonb_build_object(
      'categories', '[]'::jsonb,
      'rectorias', '[]'::jsonb,
      'sedes', '[]'::jsonb,
      'periods', '[]'::jsonb,
      'programs', '[]'::jsonb
    )
  ));
end;
$$;

