-- ============================================
-- Migração 018: Tabela de Prêmios por Participação (Draw Payouts)
-- FASE 4: Sorteios e Rateio
-- ============================================
-- 
-- Esta migração cria uma tabela para armazenar prêmios calculados
-- por participação em cada sorteio, permitindo que usuários vejam
-- automaticamente se ganharam e quanto ganharam.
-- 
-- MODIFIQUEI AQUI - Tabela para persistir prêmios por participação
-- ============================================

CREATE TABLE IF NOT EXISTS draw_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
  participation_id UUID REFERENCES participations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Categoria de premiação
  category TEXT NOT NULL CHECK (category IN ('TOP', 'SECOND', 'LOWEST', 'NONE')),
  
  -- Pontuação da participação neste sorteio
  score INTEGER NOT NULL DEFAULT 0,
  
  -- Valor ganho (0 se não premiado)
  amount_won DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Metadados
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraint: uma participação só pode ter um payout por draw
  UNIQUE(draw_id, participation_id)
);

-- Índices para consultas rápidas
CREATE INDEX idx_draw_payouts_draw_id ON draw_payouts(draw_id);
CREATE INDEX idx_draw_payouts_contest_id ON draw_payouts(contest_id);
CREATE INDEX idx_draw_payouts_participation_id ON draw_payouts(participation_id);
CREATE INDEX idx_draw_payouts_user_id ON draw_payouts(user_id);
CREATE INDEX idx_draw_payouts_category ON draw_payouts(category);
CREATE INDEX idx_draw_payouts_amount_won ON draw_payouts(amount_won DESC) WHERE amount_won > 0;

-- Comentário explicativo
COMMENT ON TABLE draw_payouts IS 'Prêmios calculados por participação em cada sorteio. Permite que usuários vejam automaticamente se ganharam e quanto ganharam.';

-- RLS: Usuários podem ver seus próprios payouts, admins podem ver todos
ALTER TABLE draw_payouts ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem visualizar seus próprios payouts
CREATE POLICY "Users can view their own payouts"
  ON draw_payouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins podem visualizar todos os payouts
CREATE POLICY "Admins can view all payouts"
  ON draw_payouts
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Policy: Apenas admins podem inserir/atualizar payouts (via sistema)
CREATE POLICY "Admins can insert payouts"
  ON draw_payouts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update payouts"
  ON draw_payouts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Policy: Apenas admins podem deletar payouts
CREATE POLICY "Admins can delete payouts"
  ON draw_payouts
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
