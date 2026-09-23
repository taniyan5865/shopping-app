-- 買い物管理アプリ DBスキーマ
-- Supabase の SQL Editor でそのまま実行してください。

create extension if not exists pgcrypto;

-- 世帯（グループ）
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

-- 世帯メンバー（匿名認証の auth.uid() と世帯を紐付け）
create table if not exists household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '家族',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- 在庫（消費期限・賞味期限を含む）
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  category text,
  quantity numeric not null default 1,
  unit text not null default '個',
  expiry_date date,
  expiry_type text not null default '賞味期限' check (expiry_type in ('賞味期限', '消費期限')),
  location text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 購入リスト
create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default '個',
  checked boolean not null default false,
  note text,
  added_by uuid references auth.users(id),
  source text not null default 'manual' check (source in ('manual', 'suggested')),
  created_at timestamptz not null default now()
);

-- 購入履歴（提案機能・価格記録に使用）
create table if not exists purchase_history (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  item_name text not null,
  category text,
  price numeric,
  store text,
  purchased_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- Web Push 購読情報
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- RLS 有効化
alter table households enable row level security;
alter table household_members enable row level security;
alter table inventory_items enable row level security;
alter table shopping_list_items enable row level security;
alter table purchase_history enable row level security;
alter table push_subscriptions enable row level security;

-- 自分が所属する世帯IDを返すヘルパー
create or replace function my_household_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select household_id from household_members where user_id = auth.uid();
$$;

-- households: 所属世帯のみ閲覧可
create policy "select own household" on households
  for select using (id in (select my_household_ids()));

-- household_members: 同じ世帯のメンバー一覧を閲覧可
create policy "select own household members" on household_members
  for select using (household_id in (select my_household_ids()));

-- inventory_items
create policy "select inventory" on inventory_items
  for select using (household_id in (select my_household_ids()));
create policy "insert inventory" on inventory_items
  for insert with check (household_id in (select my_household_ids()));
create policy "update inventory" on inventory_items
  for update using (household_id in (select my_household_ids()));
create policy "delete inventory" on inventory_items
  for delete using (household_id in (select my_household_ids()));

-- shopping_list_items
create policy "select shopping list" on shopping_list_items
  for select using (household_id in (select my_household_ids()));
create policy "insert shopping list" on shopping_list_items
  for insert with check (household_id in (select my_household_ids()));
create policy "update shopping list" on shopping_list_items
  for update using (household_id in (select my_household_ids()));
create policy "delete shopping list" on shopping_list_items
  for delete using (household_id in (select my_household_ids()));

-- purchase_history
create policy "select purchase history" on purchase_history
  for select using (household_id in (select my_household_ids()));
create policy "insert purchase history" on purchase_history
  for insert with check (household_id in (select my_household_ids()));
create policy "delete purchase history" on purchase_history
  for delete using (household_id in (select my_household_ids()));

-- push_subscriptions（本人の購読のみ操作可、送信はサーバー側 service_role で行う）
create policy "select own subscription" on push_subscriptions
  for select using (user_id = auth.uid());
create policy "insert own subscription" on push_subscriptions
  for insert with check (user_id = auth.uid());
create policy "delete own subscription" on push_subscriptions
  for delete using (user_id = auth.uid());

-- 招待コード生成（6文字英数字、重複時は再試行）
create or replace function generate_invite_code()
returns text
language plpgsql
as $$
declare
  code text;
  exists_count int;
begin
  loop
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    select count(*) into exists_count from households where invite_code = code;
    exit when exists_count = 0;
  end loop;
  return code;
end;
$$;

-- 世帯を新規作成し、自分をメンバーに登録する
create or replace function create_household(household_name text, member_name text default '家族')
returns table (id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  new_code text;
begin
  new_code := generate_invite_code();
  insert into households (name, invite_code) values (household_name, new_code) returning households.id into new_id;
  insert into household_members (household_id, user_id, display_name) values (new_id, auth.uid(), member_name);
  return query select new_id, new_code;
end;
$$;

-- 招待コードで既存の世帯に参加する
create or replace function join_household(code text, member_name text default '家族')
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  target_name text;
begin
  select households.id, households.name into target_id, target_name
    from households where invite_code = upper(code);

  if target_id is null then
    raise exception '招待コードが見つかりません';
  end if;

  insert into household_members (household_id, user_id, display_name)
    values (target_id, auth.uid(), member_name)
    on conflict (household_id, user_id) do update set display_name = excluded.display_name;

  return query select target_id, target_name;
end;
$$;

-- updated_at 自動更新
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists inventory_items_set_updated_at on inventory_items;
create trigger inventory_items_set_updated_at
  before update on inventory_items
  for each row execute function set_updated_at();
