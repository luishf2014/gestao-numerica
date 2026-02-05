🎯 DezAqui — Plataforma de Gestão de Concursos Numéricos  
Sistema completo para criação, gestão e operação de concursos numéricos com sorteios, ranking e premiação automática  
React • Vite • TypeScript • Supabase • PostgreSQL • Pix (Asaas) • PWA

📦 Funcionalidades • 🚀 Tecnologias • 📥 Instalação • 📖 Documentação • 🔐 Segurança • 🔮 Futuras Melhorias

---

## 🎉 ATUALIZAÇÕES IMPORTANTES

✅ Integração completa com Pix (Asaas) via Edge Functions  
✅ Finalização automática de concursos ao criar o primeiro sorteio  
✅ Ranking em tempo real com sistema de medalhas por categoria  
✅ Premiação automática com rateio configurável  
✅ Sistema de descontos e cupons no checkout  
✅ Relatórios profissionais (CSV, PDF e Excel)  
✅ Ativação automática (Pix) e manual (dinheiro)  
✅ CPF obrigatório e validado para pagamentos Pix  

---

## 📋 Sobre o Projeto

O **DezAqui** é uma plataforma **Web + PWA** desenvolvida para operar **concursos numéricos participativos** de forma profissional, segura e escalável.

O sistema foi projetado como um **motor genérico de concursos**, permitindo que o operador configure regras, sorteios, valores, percentuais e métodos de pagamento sem alterar o código.

Ideal para:
- Bolões numéricos
- Concursos personalizados
- Plataformas de sorteios privados
- Operações com pagamentos Pix e controle financeiro

---

## 🎯 Objetivo

Fornecer uma solução única que centraliza:

✅ Cadastro e gestão de usuários  
✅ Participações com números manuais ou automáticos  
✅ Pagamentos Pix e dinheiro  
✅ Sorteios múltiplos por concurso  
✅ Ranking em tempo real  
✅ Premiação automática com rateio  
✅ Relatórios financeiros e operacionais  
✅ Painel administrativo completo  

---

## ✨ Principais Funcionalidades

### 👤 Usuário Final
- Cadastro e autenticação
- **CPF obrigatório para pagamento Pix**
- Seleção de números:
  - Manual
  - Automática (“surpresinha”)
- Checkout com:
  - Pix (QR Code + copia e cola)
  - Dinheiro (offline)
  - Cupons de desconto
- Acompanhamento em tempo real:
  - Ranking
  - Números sorteados
  - Histórico do concurso
- Área **“Meus Tickets”**
  - Código único por participação
  - Status (pendente / ativa / cancelada)
  - Resultado financeiro por ticket

---

### 🛠️ Administrador
- CRUD completo de concursos
- Configuração de regras:
  - Universo numérico
  - Quantidade de números
  - Valores de participação
  - Percentuais de premiação
- Gestão de sorteios:
  - Manual ou aleatório
  - Múltiplos sorteios por concurso
  - **Finalização automática do concurso no primeiro sorteio**
- Ativação de participações:
  - Pix (automática via webhook)
  - Dinheiro (registro manual)
- Financeiro:
  - Histórico completo de pagamentos
  - Estatísticas em tempo real
  - Filtros por período, status e método
- Relatórios:
  - CSV, PDF e Excel
  - PDF com layout profissional e destaque de acertos
- Sistema completo de descontos e promoções

---

## 🏆 Ranking e Premiação

- Ranking **nunca fica vazio**
- Pontuação baseada na quantidade de acertos
- Premiação automática por categorias:
  - 🥇 **TOP** (pontuação máxima)
  - 🥈 **SECOND**
  - 🥉 **LOWEST** (menor pontuação positiva)
- Empates tratados corretamente
- Rateio salvo para auditoria
- Medalhas representam **categoria de premiação**, não posição matemática

---

## 🔐 Segurança

🛡️ Camadas de Proteção

**Autenticação & Acesso**
- Supabase Auth
- JWT seguro
- Controle de acesso por perfil (Admin / Usuário)
- Proteção de rotas administrativas

**Banco de Dados**
- PostgreSQL
- Row Level Security (RLS)
- Triggers e validações server-side
- Queries seguras e auditáveis

**Pagamentos Pix**
- Integração com Asaas via **Supabase Edge Functions**
- `ASAAS_API_KEY` nunca exposta no frontend
- Webhook validado por token
- Processamento idempotente
- Atualização transacional (pagamento + ativação)

---

## 🚀 Stack Tecnológica

### Frontend
- React
- Vite
- TypeScript
- TailwindCSS
- PWA

### Backend
- Supabase (BaaS)
- PostgreSQL
- RLS Policies
- Database Triggers
- Edge Functions

### Pagamentos
- Asaas (Pix)
- QR Code dinâmico
- Webhooks automáticos

### DevOps & Tools
- Git & GitHub
- Supabase CLI
- ESLint
- Prettier

---

## 📥 Instalação

### Pré-requisitos
- Node.js 18+
- Git
- Conta no Supabase
- Conta no Asaas (sandbox ou produção)

### Passo a Passo
```bash
git clone <repo-url>
cd dezaqui
cd frontend
npm install
npm run dev
Frontend disponível em:
http://localhost:3000

📂 Estrutura do Projeto
gestao-numerica/
├── frontend/
│   └── src/
│       ├── contexts/
│       ├── pages/
│       ├── services/
│       ├── components/
│       └── lib/
├── supabase/
│   └── functions/
│       ├── asaas-create-pix/
│       ├── asaas-webhook/
│       └── README.md
├── backend/
│   └── migrations/
└── README.md
🔮 Futuras Melhorias

Painel administrativo para pagamento de prêmios

Cancelamento de participações (admin e usuário)

Permitir que o administrador configure o gateway de pagamento

Alternar sandbox/produção

Habilitar/desabilitar métodos

Parametrização sem alteração de código

⚠️ Aviso Legal
Esta plataforma é fornecida exclusivamente como solução tecnológica.
Responsabilidades legais, fiscais e regulatórias pelo uso em produção são do operador.

👨‍💻 Autor
Luis Henrique
Desenvolvedor Full Stack

Projeto desenvolvido do zero, incluindo:

Arquitetura

Backend

Frontend

Regras de negócio

Integração Pix

Segurança

UX/UI

Documentação