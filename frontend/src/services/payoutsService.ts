/**
 * Serviço de acesso a dados de prêmios (payouts)
 * FASE 4: Sorteios e Rateio
 * 
 * MODIFIQUEI AQUI - Serviço para buscar prêmios de participações
 */
import { supabase } from '../lib/supabase'

export interface DrawPayout {
  id: string
  draw_id: string
  contest_id: string
  participation_id: string
  user_id: string
  category: 'TOP' | 'SECOND' | 'LOWEST' | 'NONE'
  score: number
  amount_won: number
  processed_at: string
}

/**
 * Busca prêmios de uma participação em um sorteio específico
 * MODIFIQUEI AQUI - Função para buscar prêmio de participação em sorteio
 */
export async function getPayoutByParticipationAndDraw(
  participationId: string,
  drawId: string
): Promise<DrawPayout | null> {
  const { data, error } = await supabase
    .from('draw_payouts')
    .select('*')
    .eq('participation_id', participationId)
    .eq('draw_id', drawId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Não encontrado
    }
    throw new Error(`Erro ao buscar prêmio: ${error.message}`)
  }

  return data
}

/**
 * Busca todos os prêmios de uma participação (todos os sorteios)
 * MODIFIQUEI AQUI - Função para buscar todos os prêmios de uma participação
 */
export async function getPayoutsByParticipation(
  participationId: string
): Promise<DrawPayout[]> {
  const { data, error } = await supabase
    .from('draw_payouts')
    .select('*')
    .eq('participation_id', participationId)
    .order('processed_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar prêmios: ${error.message}`)
  }

  return data || []
}

/**
 * Busca todos os prêmios de um sorteio
 * MODIFIQUEI AQUI - Função para buscar prêmios de um sorteio
 */
export async function getPayoutsByDraw(drawId: string): Promise<DrawPayout[]> {
  const { data, error } = await supabase
    .from('draw_payouts')
    .select('*')
    .eq('draw_id', drawId)
    .order('amount_won', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar prêmios do sorteio: ${error.message}`)
  }

  return data || []
}

/**
 * Busca resumo de categorias premiadas de um sorteio
 * MODIFIQUEI AQUI - Função para buscar resumo de categorias premiadas
 */
export async function getDrawPayoutSummary(drawId: string): Promise<{
  maxScore: number
  categories: {
    TOP: { score: number; winnersCount: number; amountPerWinner: number } | null
    SECOND: { score: number; winnersCount: number; amountPerWinner: number } | null
    LOWEST: { score: number; winnersCount: number; amountPerWinner: number } | null
  }
}> {
  const payouts = await getPayoutsByDraw(drawId)

  if (payouts.length === 0) {
    return {
      maxScore: 0,
      categories: {
        TOP: null,
        SECOND: null,
        LOWEST: null,
      },
    }
  }

  // Encontrar maior pontuação
  const maxScore = Math.max(...payouts.map(p => p.score))

  // Agrupar por categoria
  const topPayouts = payouts.filter(p => p.category === 'TOP' && p.amount_won > 0)
  const secondPayouts = payouts.filter(p => p.category === 'SECOND' && p.amount_won > 0)
  const lowestPayouts = payouts.filter(p => p.category === 'LOWEST' && p.amount_won > 0)

  return {
    maxScore,
    categories: {
      TOP: topPayouts.length > 0 ? {
        score: topPayouts[0].score,
        winnersCount: topPayouts.length,
        amountPerWinner: topPayouts[0].amount_won,
      } : null,
      SECOND: secondPayouts.length > 0 ? {
        score: secondPayouts[0].score,
        winnersCount: secondPayouts.length,
        amountPerWinner: secondPayouts[0].amount_won,
      } : null,
      LOWEST: lowestPayouts.length > 0 ? {
        score: lowestPayouts[0].score,
        winnersCount: lowestPayouts.length,
        amountPerWinner: lowestPayouts[0].amount_won,
      } : null,
    },
  }
}
