-- Studio Paty Heinz
-- Execute este arquivo uma vez no SQL Editor do novo projeto Supabase.

create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  telefone text not null default '',
  notas text not null default '',
  "ultimaVisita" timestamptz,
  "dataNascimento" text,
  created_at timestamptz not null default now()
);

create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tempo text not null default '01:00',
  "valorBase" numeric(12,2) not null default 0 check ("valorBase" >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor numeric(12,2) not null default 0 check (valor >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  "clienteNome" text not null,
  servico text not null,
  "dataInicio" timestamptz not null,
  "dataFim" timestamptz not null,
  imagem text,
  imagens text[] not null default '{}',
  "valorTotal" numeric(12,2) not null default 0 check ("valorTotal" >= 0),
  "valorSinal" numeric(12,2) not null default 0 check ("valorSinal" >= 0),
  status text not null default 'agendado' check (status in ('agendado', 'pendente', 'concluido', 'cancelado')),
  cor text,
  telefone text,
  "metodoSinal" text check ("metodoSinal" is null or "metodoSinal" in ('Dinheiro', 'Cartão', 'Pix')),
  created_at timestamptz not null default now(),
  check ("dataFim" > "dataInicio"),
  check ("valorSinal" <= "valorTotal")
);

create table if not exists public.transacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('receita', 'despesa')),
  categoria text not null,
  descricao text not null,
  valor numeric(12,2) not null check (valor > 0),
  metodo text not null check (metodo in ('Dinheiro', 'Cartão', 'Pix')),
  data timestamptz not null,
  conta text not null default 'Empresa',
  created_at timestamptz not null default now()
);

create table if not exists public.despesas_fixas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  descricao text not null,
  valor numeric(12,2) not null check (valor > 0),
  categoria text not null,
  vencimento integer not null check (vencimento between 1 and 31),
  conta text not null default 'Empresa',
  created_at timestamptz not null default now()
);

create table if not exists public.configuracoes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cor_hexa text not null default 'bg-[#C9797F]',
  fundo_hexa text not null default '#FFF7F7',
  template_comprovante text,
  template_compromisso text,
  template_anamnese text,
  template_menores text,
  updated_at timestamptz not null default now()
);

create index if not exists clientes_user_id_idx on public.clientes(user_id);
create index if not exists servicos_user_id_idx on public.servicos(user_id);
create index if not exists produtos_user_id_idx on public.produtos(user_id);
create index if not exists agendamentos_user_data_idx on public.agendamentos(user_id, "dataInicio");
create index if not exists transacoes_user_data_idx on public.transacoes(user_id, data desc);
create index if not exists despesas_fixas_user_idx on public.despesas_fixas(user_id, vencimento);

alter table public.clientes enable row level security;
alter table public.servicos enable row level security;
alter table public.produtos enable row level security;
alter table public.agendamentos enable row level security;
alter table public.transacoes enable row level security;
alter table public.despesas_fixas enable row level security;
alter table public.configuracoes enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clientes', 'servicos', 'produtos', 'agendamentos',
    'transacoes', 'despesas_fixas', 'configuracoes'
  ]
  loop
    execute format('drop policy if exists "Usuário gerencia os próprios dados" on public.%I', table_name);
    execute format(
      'create policy "Usuário gerencia os próprios dados" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      table_name
    );
  end loop;
end $$;

-- Bucket público para as imagens dos atendimentos. Os arquivos ficam separados
-- pelo UUID do usuário: agendamentos/<user_id>/<arquivo>.webp.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('agendamentos', 'agendamentos', true, 10485760, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Imagens públicas dos agendamentos" on storage.objects;
create policy "Imagens públicas dos agendamentos"
on storage.objects for select
to public
using (bucket_id = 'agendamentos');

drop policy if exists "Usuário envia imagens para a própria pasta" on storage.objects;
create policy "Usuário envia imagens para a própria pasta"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'agendamentos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Usuário altera imagens da própria pasta" on storage.objects;
create policy "Usuário altera imagens da própria pasta"
on storage.objects for update
to authenticated
using (
  bucket_id = 'agendamentos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'agendamentos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Usuário exclui imagens da própria pasta" on storage.objects;
create policy "Usuário exclui imagens da própria pasta"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'agendamentos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
