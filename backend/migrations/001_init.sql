-- ============================================
-- Migração 001: Estrutura Inicial do Banco
-- FASE 1: Fundação do Sistema
-- ============================================
-- 
-- Esta migração cria as tabelas principais do sistema:
-- - profiles (perfis de usuários - integrado com Supabase Auth)
-- - contests (concursos)
-- - participations (participações)
-- - draws (sorteios)
-- - payments (pagamentos)
--
-- Respeitando o modelo de domínio definido em docs/01_domain_model.md
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: profiles
-- Perfis de usuários integrados com Supabase Auth
-- Representa qualquer pessoa no sistema (admin ou participante)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);

-- ============================================
-- TABELA: contests
-- Objeto central do sistema - define regras e configurações
-- ============================================
CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Configuração do universo numérico
  min_number INTEGER NOT NULL DEFAULT 1,
  max_number INTEGER NOT NULL DEFAULT 60,
  numbers_per_participation INTEGER NOT NULL DEFAULT 6,
  
  -- Datas e status
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'finished', 'cancelled')),
  
  -- Valores financeiros (FASE 3+)
  participation_value DECIMAL(10, 2),
  
  -- Configurações de premiação (FASE 4+)
  -- Percentuais serão configurados em tabela separada na FASE 4
  
  -- Metadados
  created_by UUID REFERENCES profiles(id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para contests
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_dates ON contests(start_date, end_date);
CREATE INDEX idx_contests_created_by ON contests(created_by);

-- ============================================
-- TABELA: participations
-- Vínculo entre usuário e concurso com números escolhidos
-- ============================================
CREATE TABLE participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Números escolhidos (armazenados como array JSON)
  -- Exemplo: [1, 5, 12, 23, 45, 60]
  numbers INTEGER[] NOT NULL,
  
  -- Status da participação
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  
  -- Pontuação atual (calculada após sorteios - FASE 4)
  current_score INTEGER DEFAULT 0 NOT NULL,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Nota: Um mesmo usuário pode ter múltiplas participações no mesmo concurso
-- A constraint UNIQUE(contest_id, user_id) foi removida para permitir isso

-- Índices para participations
CREATE INDEX idx_participations_contest_id ON participations(contest_id);
CREATE INDEX idx_participations_user_id ON participations(user_id);
CREATE INDEX idx_participations_status ON participations(status);
CREATE INDEX idx_participations_score ON participations(current_score DESC);

-- ============================================
-- TABELA: draws
-- Eventos de sorteio dentro de um concurso
-- 
-- IMPORTANTE: Esta tabela armazena eventos IMUTÁVEIS.
-- Registros de sorteios não devem ser alterados ou deletados após criação,
-- pois são eventos históricos que afetam cálculos de pontuação e ranking.
-- 
-- A proteção contra alterações e deleções será implementada via RLS (Row Level Security)
-- ou triggers em fases futuras (FASE 2+).
-- Por enquanto, a imutabilidade é garantida pela lógica da aplicação.
-- ============================================
CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
  
  -- Números sorteados (armazenados como array JSON)
  -- Exemplo: [3, 7, 15, 22, 38, 55]
  numbers INTEGER[] NOT NULL,
  
  -- Data e hora do sorteio
  draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Nota: Validação de números únicos dentro do sorteio será feita via trigger ou aplicação

-- Índices para draws
CREATE INDEX idx_draws_contest_id ON draws(contest_id);
CREATE INDEX idx_draws_draw_date ON draws(draw_date);

-- ============================================
-- TABELA: payments
-- Eventos financeiros associados a participações
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participation_id UUID REFERENCES participations(id) ON DELETE CASCADE NOT NULL,
  
  -- Valor do pagamento
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Status do pagamento
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  
  -- Método de pagamento (FASE 3+)
  payment_method TEXT CHECK (payment_method IN ('pix', 'cash', 'manual')),
  
  -- Dados do pagamento externo (FASE 3+)
  external_id TEXT, -- ID do pagamento na API Asaas
  external_data JSONB, -- Dados adicionais do pagamento externo
  
  -- Metadados
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para payments
CREATE INDEX idx_payments_participation_id ON payments(participation_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_external_id ON payments(external_id) WHERE external_id IS NOT NULL;

-- ============================================
-- TRIGGERS: Atualização automática de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contests_updated_at BEFORE UPDATE ON contests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participations_updated_at BEFORE UPDATE ON participations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTÁRIOS DAS TABELAS
-- ============================================
COMMENT ON TABLE profiles IS 'Perfis de usuários integrados com Supabase Auth (administradores e participantes)';
COMMENT ON TABLE contests IS 'Concursos configuráveis com regras e datas';
COMMENT ON TABLE participations IS 'Participações de usuários em concursos com números escolhidos. Um usuário pode ter múltiplas participações no mesmo concurso';
COMMENT ON TABLE draws IS 'Sorteios realizados dentro de concursos (eventos imutáveis - não devem ser alterados ou deletados após criação)';
COMMENT ON TABLE payments IS 'Pagamentos associados a participações (eventos financeiros)';
