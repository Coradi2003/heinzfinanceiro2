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

create table if not exists public.tabela_precos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  descricao text not null default '',
  valor numeric(12,2) not null default 0 check (valor >= 0),
  duracao text not null default '',
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

-- Migração segura para bancos que já tinham a tabela de transações.
alter table public.transacoes
  add column if not exists agendamento_id uuid;

alter table public.transacoes
  drop constraint if exists transacoes_agendamento_id_fkey;

alter table public.transacoes
  add constraint transacoes_agendamento_id_fkey
  foreign key (agendamento_id)
  references public.agendamentos(id)
  on delete cascade;

-- Vincula lançamentos antigos aos respectivos agendamentos quando houver
-- correspondência exata de cliente, serviço e valor.
update public.transacoes as t
set agendamento_id = a.id
from public.agendamentos as a
where t.agendamento_id is null
  and t.user_id = a.user_id
  and t.categoria in ('Sinal de Procedimento', 'Sinal de Tatuagem')
  and t.descricao = concat('Sinal - ', a."clienteNome", ' (', a.servico, ')')
  and abs(t.valor - a."valorSinal") < 0.01;

update public.transacoes as t
set agendamento_id = a.id
from public.agendamentos as a
where t.agendamento_id is null
  and t.user_id = a.user_id
  and t.categoria = 'Sessão Concluída'
  and t.descricao = concat('Restante - ', a."clienteNome", ' (', a.servico, ')')
  and abs(t.valor - (a."valorTotal" - a."valorSinal")) < 0.01;

-- Remove somente lançamentos automáticos antigos cujo agendamento já não existe.
delete from public.transacoes
where agendamento_id is null
  and (
    (categoria in ('Sinal de Procedimento', 'Sinal de Tatuagem') and descricao like 'Sinal - %')
    or (categoria = 'Sessão Concluída' and descricao like 'Restante - %')
  );

create index if not exists clientes_user_id_idx on public.clientes(user_id);
create index if not exists servicos_user_id_idx on public.servicos(user_id);
create index if not exists produtos_user_id_idx on public.produtos(user_id);
create index if not exists agendamentos_user_data_idx on public.agendamentos(user_id, "dataInicio");
create index if not exists transacoes_user_data_idx on public.transacoes(user_id, data desc);
create index if not exists transacoes_agendamento_id_idx on public.transacoes(agendamento_id);
create index if not exists despesas_fixas_user_idx on public.despesas_fixas(user_id, vencimento);
create index if not exists tabela_precos_user_ordem_idx on public.tabela_precos(user_id, ordem);

alter table public.clientes enable row level security;
alter table public.servicos enable row level security;
alter table public.produtos enable row level security;
alter table public.agendamentos enable row level security;
alter table public.transacoes enable row level security;
alter table public.despesas_fixas enable row level security;
alter table public.configuracoes enable row level security;
alter table public.tabela_precos enable row level security;

drop policy if exists "Usuário gerencia os próprios dados" on public.clientes;
create policy "Usuário gerencia os próprios dados" on public.clientes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário gerencia os próprios dados" on public.servicos;
create policy "Usuário gerencia os próprios dados" on public.servicos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário gerencia os próprios dados" on public.produtos;
create policy "Usuário gerencia os próprios dados" on public.produtos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário gerencia os próprios dados" on public.agendamentos;
create policy "Usuário gerencia os próprios dados" on public.agendamentos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário gerencia os próprios dados" on public.transacoes;
create policy "Usuário gerencia os próprios dados" on public.transacoes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário gerencia os próprios dados" on public.despesas_fixas;
create policy "Usuário gerencia os próprios dados" on public.despesas_fixas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário gerencia os próprios dados" on public.configuracoes;
create policy "Usuário gerencia os próprios dados" on public.configuracoes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário gerencia os próprios dados" on public.tabela_precos;
create policy "Usuário gerencia os próprios dados" on public.tabela_precos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
