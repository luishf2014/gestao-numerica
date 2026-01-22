# Migrações do Banco de Dados

Este diretório contém as migrações SQL do banco de dados PostgreSQL (Supabase).

## Estrutura

As migrações são numeradas sequencialmente e devem ser aplicadas em ordem:

- `001_init.sql` - Estrutura inicial do banco (FASE 1)
- `002_auth_profiles_trigger.sql` - Sincronização automática Auth -> Profiles (FASE 1)
- `003_rls.sql` - Row Level Security policies (FASE 2+)
- `004_seed.sql` - Dados iniciais para desenvolvimento (opcional)

## Aplicação das Migrações

### Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Execute cada arquivo de migração em ordem

### Via Supabase CLI

```bash
supabase db push
```

## Importante

- **Nunca modifique migrações já aplicadas** em produção
- Crie novas migrações para alterações
- Teste sempre em ambiente de desenvolvimento primeiro
- Faça backup antes de aplicar migrações em produção
