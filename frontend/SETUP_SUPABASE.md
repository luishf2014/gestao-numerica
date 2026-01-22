# Configuração do Supabase - FASE 1

## Passo a Passo

### 1. Criar o arquivo `.env.local`

Na raiz da pasta `frontend/`, crie o arquivo `.env.local` com o seguinte conteúdo:

```env
# ============================================
# Configuração do Supabase
# FASE 1: Fundação do Sistema
# ============================================
# 
# Este arquivo contém as credenciais do Supabase para desenvolvimento local.
# NUNCA commite este arquivo no repositório (já está no .gitignore).
#
# Para produção, configure essas variáveis no ambiente do servidor.
# ============================================

VITE_SUPABASE_URL=https://lwemxvsiyvnkcwmipdjr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZW14dnNpeXZua2N3bWlwZGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODc5MzksImV4cCI6MjA4NDY2MzkzOX0.D_rT2AdcueP-RV5bzYdtPFmLpVjQjMgiIsWSdgNKtZQ
```

### 2. Verificar a configuração

Após criar o arquivo `.env.local`:

1. **Reinicie o servidor de desenvolvimento** (se estiver rodando):
   ```bash
   # Pare o servidor (Ctrl+C) e inicie novamente
   npm run dev
   ```

2. **Verifique se não há erros** no console do navegador ou terminal

### 3. Testar a conexão

O cliente Supabase está configurado em `src/lib/supabase.ts` e será automaticamente validado ao iniciar a aplicação.

Se as variáveis não estiverem configuradas, você verá uma mensagem de erro clara indicando o problema.

## Estrutura de Arquivos

```
frontend/
├── .env.local          ← Criar este arquivo (não commitado)
├── src/
│   └── lib/
│       └── supabase.ts ← Cliente Supabase (já configurado)
└── SETUP_SUPABASE.md   ← Este arquivo
```

## Importante

- ⚠️ **Nunca commite o arquivo `.env.local`** (já está no .gitignore)
- ✅ O arquivo `.env.local` é apenas para desenvolvimento local
- ✅ Para produção, configure as variáveis no ambiente do servidor
- ✅ Após criar/editar `.env.local`, sempre reinicie o servidor de desenvolvimento

## Próximos Passos (FASE 2)

Com o Supabase configurado, você pode:
- Implementar autenticação de usuários
- Criar policies de segurança (RLS)
- Desenvolver funcionalidades que consomem dados do backend
