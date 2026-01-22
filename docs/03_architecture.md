# Arquitetura do Sistema

## Visão Geral

Este sistema é uma plataforma configurável de concursos numéricos, construída com arquitetura moderna, desacoplada e escalável.

A aplicação é dividida em três camadas principais:

- Frontend (Web + PWA)
- Backend (Supabase)
- Serviços externos (Pagamentos e Notificações)

O sistema foi projetado para ser:
- Genérico (não acoplado a um jogo específico)
- Configurável por concurso
- Seguro e auditável
- Evolutivo por fases

---

## Arquitetura em Camadas

### 1. Frontend (Client)

Tecnologias:
- React
- Vite
- TailwindCSS
- PWA

Responsabilidades:
- Interface do usuário
- Volante numérico dinâmico
- Ranking em tempo real
- Visualização de sorteios
- Interações administrativas

O frontend **não contém regras de negócio críticas**.
Toda regra sensível é validada no backend.

---

### 2. Backend (Supabase)

Componentes:
- PostgreSQL (dados)
- Supabase Auth (autenticação)
- Edge Functions (lógica server-side)
- Webhooks (pagamentos)

Responsabilidades:
- Persistência de dados
- Validações de negócio
- Controle de status (participações, pagamentos)
- Cálculos de pontuação e rateio
- Segurança e autorização

---

### 3. Banco de Dados (PostgreSQL)

O banco é a **fonte da verdade** do sistema.

Características:
- Modelo relacional normalizado
- Eventos imutáveis (sorteios e pagamentos)
- Dados derivados controlados (pontuação)
- Preparado para RLS

Migrações versionadas:
- 001_init.sql
- 002_rls.sql
- 003_seed.sql
- etc.

---

### 4. Pagamentos (Asaas / Pix)

Integração via:
- API REST
- Webhooks

Fluxo:
1. Criação de cobrança
2. Pagamento confirmado via webhook
3. Atualização do pagamento
4. Ativação da participação

A lógica de pagamento é isolada e desacoplada do frontend.

---

## Princípios Arquiteturais

- Backend é autoridade máxima
- Frontend é consumidor de dados
- Regras financeiras nunca ficam no client
- Concursos são entidades configuráveis
- Sorteios são eventos, não regras
- Pagamentos são eventos independentes

---

## Evolução por Fases

FASE 1:
- Estrutura de dados
- Base do sistema

FASE 2:
- Experiência do usuário
- Ranking e visualização

FASE 3:
- Pagamentos
- Ativação automática

FASE 4:
- Sorteios
- Rateio inteligente

FASE 5:
- Notificações
- Escala e operação real
