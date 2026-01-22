# Backend - Gestão Numérica

Backend baseado em Supabase (PostgreSQL + Auth + Edge Functions).

## Estrutura

```
backend/
└── migrations/     # Migrações SQL versionadas
    ├── 001_init.sql    # Estrutura inicial (FASE 1)
    ├── 002_rls.sql     # Row Level Security (FASE 2+)
    └── 003_seed.sql    # Dados iniciais (opcional)
```

## Migrações

As migrações são aplicadas sequencialmente e criam/modificam a estrutura do banco de dados.

### Aplicação via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute cada arquivo de migração em ordem numérica

### Aplicação via Supabase CLI

```bash
supabase db push
```

## Modelo de Dados

O banco de dados segue o modelo de domínio definido em `docs/01_domain_model.md`:

- **users** - Usuários do sistema
- **contests** - Concursos configuráveis
- **participations** - Participações de usuários
- **draws** - Sorteios realizados
- **payments** - Pagamentos associados

## Importante

- **Nunca modifique migrações já aplicadas** em produção
- Crie novas migrações para alterações
- Teste sempre em ambiente de desenvolvimento primeiro
- Faça backup antes de aplicar migrações em produção
