/**
 * Helpers para categorias de premiação baseadas em payouts
 * MODIFIQUEI AQUI - Funções para determinar categorias de premiação
 * 
 * Medalhas representam categoria de premiação, não posição matemática:
 * 🥇 TOP → score == numbers_per_participation
 * 🥈 SECOND → score == numbers_per_participation - 1
 * 🥉 LOWEST → menor pontuação positiva do sorteio
 * ❌ NONE → não premiado
 */

import { DrawPayout } from '../services/payoutsService'

export type PayoutCategory = 'TOP' | 'SECOND' | 'LOWEST' | 'NONE'

export interface ParticipationWithCategory {
  participationId: string
  category: PayoutCategory
  medal?: '🥇' | '🥈' | '🥉'
  amountWon: number
  score: number
}

/**
 * Determina a categoria de premiação baseada no payout
 * MODIFIQUEI AQUI - Função para determinar categoria de premiação
 * 
 * @param payout Payout da participação
 * @returns Categoria de premiação e medalha correspondente
 */
export function getPayoutCategory(payout: DrawPayout | null | undefined): {
  category: PayoutCategory
  medal?: '🥇' | '🥈' | '🥉'
} {
  if (!payout || payout.amount_won === 0) {
    return { category: 'NONE' }
  }

  switch (payout.category) {
    case 'TOP':
      return { category: 'TOP', medal: '🥇' }
    case 'SECOND':
      return { category: 'SECOND', medal: '🥈' }
    case 'LOWEST':
      return { category: 'LOWEST', medal: '🥉' }
    default:
      return { category: 'NONE' }
  }
}

/**
 * Agrupa participações por categoria de premiação
 * MODIFIQUEI AQUI - Função para agrupar participações por categoria
 * 
 * @param payouts Map de participationId -> DrawPayout
 * @returns Map de categoria -> array de participações com categoria
 */
export function groupParticipationsByCategory(
  payouts: Record<string, DrawPayout>
): {
  TOP: ParticipationWithCategory[]
  SECOND: ParticipationWithCategory[]
  LOWEST: ParticipationWithCategory[]
  NONE: ParticipationWithCategory[]
} {
  const grouped: {
    TOP: ParticipationWithCategory[]
    SECOND: ParticipationWithCategory[]
    LOWEST: ParticipationWithCategory[]
    NONE: ParticipationWithCategory[]
  } = {
    TOP: [],
    SECOND: [],
    LOWEST: [],
    NONE: [],
  }

  Object.entries(payouts).forEach(([participationId, payout]) => {
    const { category, medal } = getPayoutCategory(payout)
    grouped[category].push({
      participationId,
      category,
      medal,
      amountWon: payout.amount_won,
      score: payout.score,
    })
  })

  return grouped
}

/**
 * Obtém o rótulo da categoria
 * MODIFIQUEI AQUI - Função para obter rótulo da categoria
 * 
 * @param category Categoria de premiação
 * @returns Rótulo formatado
 */
export function getCategoryLabel(category: PayoutCategory): string {
  switch (category) {
    case 'TOP':
      return '1º Lugar (TOP)'
    case 'SECOND':
      return '2º Lugar (SECOND)'
    case 'LOWEST':
      return '3º Lugar (LOWEST)'
    case 'NONE':
      return 'Não premiado'
  }
}
