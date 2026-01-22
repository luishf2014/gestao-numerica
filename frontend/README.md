# Frontend - Gestão Numérica

Aplicação React + Vite + TailwindCSS para a plataforma de gestão de concursos numéricos.

## Tecnologias

- **React 18** - Biblioteca UI
- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização
- **React Router** - Roteamento
- **Supabase JS** - Cliente do backend

## Estrutura

```
src/
├── contexts/        # Contextos React (Auth, etc)
├── lib/            # Bibliotecas e utilitários (Supabase client)
├── pages/          # Páginas da aplicação
├── components/     # Componentes reutilizáveis
├── types/          # Tipos TypeScript do domínio
└── App.tsx         # Componente raiz
```

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env.local
   ```
   
   Edite `.env.local` com suas credenciais do Supabase.

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## Princípios

- **Backend é autoridade máxima**: Frontend apenas consome dados
- **Sem regras de negócio no client**: Validações críticas no backend
- **Código limpo e comentado**: Facilita manutenção e evolução
- **Preparado para evolução**: Estrutura suporta crescimento por fases
