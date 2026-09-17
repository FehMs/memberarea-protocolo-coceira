-- Execute no SQL Editor do Supabase. Não inclui conteúdos fictícios.
create table public.purchases (
  order_id text primary key,
  product_id text not null,
  email text not null,
  status text not null check (status in ('paid','refunded','chargedback')),
  updated_at timestamptz not null default now()
);
create index purchases_access_idx on public.purchases(email, product_id, status);
alter table public.purchases enable row level security;

create function public.has_product_access(target_product text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.purchases p join auth.users u on lower(u.email) = p.email
    where u.id = auth.uid() and u.email_confirmed_at is not null
      and p.product_id = target_product and p.status = 'paid'
  );
$$;
revoke all on function public.has_product_access(text) from public, anon;
grant execute on function public.has_product_access(text) to authenticated;
create function public.member_email() returns text language sql stable security definer set search_path = '' as $$
  select lower(email) from auth.users where id = auth.uid() and email_confirmed_at is not null;
$$;
revoke all on function public.member_email() from public, anon;
grant execute on function public.member_email() to authenticated;
create policy own_purchases on public.purchases for select to authenticated using (email = public.member_email());

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  section text not null check (section in ('protocol','bonus','checklist')),
  label text not null,
  title text not null,
  description text not null default '',
  body text not null,
  image_path text,
  file_path text,
  position integer not null default 0,
  published boolean not null default false
);
alter table public.materials enable row level security;
create policy purchased_materials on public.materials for select to authenticated
using (published and public.has_product_access(product_id));
revoke all on public.purchases, public.materials from anon, authenticated;
grant select on public.purchases, public.materials to authenticated;
grant all on public.purchases, public.materials to service_role;

create function public.record_cakto_purchases(orders jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare item jsonb;
begin
  for item in select value from jsonb_array_elements(orders) loop
    insert into public.purchases(order_id, product_id, email, status)
    values(item->>'order_id', item->>'product_id', item->>'email', item->>'status')
    on conflict (order_id) do update set
      status = case when public.purchases.status in ('refunded','chargedback')
        then public.purchases.status else excluded.status end,
      updated_at = now();
  end loop;
end;
$$;
revoke all on function public.record_cakto_purchases(jsonb) from public, anon, authenticated;
grant execute on function public.record_cakto_purchases(jsonb) to service_role;

insert into storage.buckets(id, name, public) values ('materials','materials',false) on conflict do nothing;
create policy purchased_files on storage.objects for select to authenticated using (
  bucket_id = 'materials' and exists (
    select 1 from public.materials m where m.published
      and (m.image_path = name or m.file_path = name)
      and public.has_product_access(m.product_id)
  )
);
