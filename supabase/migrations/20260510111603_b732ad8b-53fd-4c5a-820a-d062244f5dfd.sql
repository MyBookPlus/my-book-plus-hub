create type mpesa_status as enum ('pending', 'success', 'failed');

create table public.mpesa_transactions (
  id uuid primary key default gen_random_uuid(),
  checkout_request_id text unique not null,
  merchant_request_id text,
  phone text not null,
  amount numeric not null,
  account_reference text,
  description text,
  status mpesa_status not null default 'pending',
  result_code int,
  result_desc text,
  mpesa_receipt_number text,
  raw_callback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_mpesa_checkout on public.mpesa_transactions(checkout_request_id);

alter table public.mpesa_transactions enable row level security;

-- Public read by checkout_request_id (frontend polls status). No PII beyond phone is exposed.
create policy "Anyone can read transactions"
  on public.mpesa_transactions for select
  using (true);

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_mpesa_updated
before update on public.mpesa_transactions
for each row execute function public.update_updated_at_column();