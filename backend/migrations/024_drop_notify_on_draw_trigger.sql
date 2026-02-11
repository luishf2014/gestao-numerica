-- ============================================
-- Script para remover trigger de notificação de sorteio
-- Execute este script ANTES de executar 024_notify_on_draw_created.sql
-- ============================================

-- Remover trigger se existir
DROP TRIGGER IF EXISTS trigger_notify_on_draw_created ON draws;

-- Remover função se existir
DROP FUNCTION IF EXISTS notify_on_draw_created();

-- Comentário informativo
DO $$
BEGIN
  RAISE NOTICE 'Trigger e função de notificação de sorteio removidos com sucesso.';
  RAISE NOTICE 'Agora você pode executar a migração 024_notify_on_draw_created.sql';
END $$;
