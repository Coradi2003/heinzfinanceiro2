# Studio Paty Heinz

Sistema de gestão para estúdio de beleza, com agenda, clientes, serviços,
produtos, financeiro, relatórios, documentos personalizados e instalação como
PWA.

## Configuração local

1. Instale as dependências com `npm ci`.
2. Confira as variáveis `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`.
3. No SQL Editor do Supabase, execute todo o arquivo `supabase-schema.sql`.
4. Em Authentication > Users, crie o usuário que terá acesso ao sistema.
5. Inicie com `npm run dev`.

O SQL cria as tabelas, índices, Row Level Security e o bucket público
`agendamentos`. Cada registro e cada upload são vinculados ao usuário
autenticado.

## Validação

- Build de produção: `npm run build`
- Verificação estática: `npm run lint`

## Tecnologias

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand e Supabase.
