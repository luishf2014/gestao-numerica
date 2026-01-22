# Configuração de Variáveis de Ambiente

## Passo a Passo

1. **Crie o arquivo `.env.local` na raiz da pasta `frontend/`**

2. **Adicione as seguintes variáveis:**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

## Onde encontrar as credenciais

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Importante

- ⚠️ **Nunca commite o arquivo `.env.local`** (já está no .gitignore)
- ✅ Use `.env.local` para desenvolvimento local
- ✅ Use variáveis de ambiente do servidor para produção

## Exemplo de arquivo `.env.local`

```env
# Configuração do Supabase
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.exemplo-chave-anon
```
