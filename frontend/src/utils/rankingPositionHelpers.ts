/**
 * Helpers para cálculo de posições em rankings com empates
 * MODIFIQUEI AQUI - Função para calcular posições respeitando empates
 * 
 * Ranking competitivo: participantes com mesma pontuação compartilham a mesma posição
 * Exemplo: scores [3,2,2,1,0] → posições [1,2,2,4,5]
 */

export interface RankedParticipation<T> {
  participation: T
  score: number
  position: number
  medal?: '🥇' | '🥈' | '🥉'
}

/**
 * Calcula posições com empates (ranking competitivo)
 * MODIFIQUEI AQUI - Função para calcular posições respeitando empates
 * 
 * @param participations Array de participações
 * @param getScore Função para obter a pontuação de uma participação
 * @returns Array de participações com posição e medalha calculadas
 */
export function calculateRankedPositions<T>(
  participations: T[],
  getScore: (p: T) => number
): RankedParticipation<T>[] {
  if (participations.length === 0) return []

  // MODIFIQUEI AQUI - Ordenar por pontuação desc, tie-breaker por created_at asc (assumindo que T tem created_at)
  const sorted = [...participations].sort((a, b) => {
    const scoreA = getScore(a)
    const scoreB = getScore(b)
    if (scoreB !== scoreA) return scoreB - scoreA
    
    // Tie-breaker: quem criou primeiro fica na frente (assumindo propriedade created_at)
    const dateA = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0
    const dateB = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0
    return dateA - dateB
  })

  // MODIFIQUEI AQUI - Calcular posições com empates (ranking competitivo)
  const ranked: RankedParticipation<T>[] = []
  let currentPosition = 1
  let previousScore: number | null = null

  sorted.forEach((participation, index) => {
    const score = getScore(participation)
    
    // Se a pontuação mudou, atualizar a posição atual
    if (previousScore !== null && score !== previousScore) {
      currentPosition = index + 1
    }
    
    // Atribuir medalha apenas para posições 1, 2, 3 e apenas quando score > 0
    let medal: '🥇' | '🥈' | '🥉' | undefined = undefined
    if (score > 0 && currentPosition === 1) {
      medal = '🥇'
    } else if (score > 0 && currentPosition === 2) {
      medal = '🥈'
    } else if (score > 0 && currentPosition === 3) {
      medal = '🥉'
    }

    ranked.push({
      participation,
      score,
      position: currentPosition,
      medal,
    })

    previousScore = score
  })

  return ranked
}

/**
 * Filtra participantes com pontuação > 0 para exibição no pódio
 * MODIFIQUEI AQUI - Função para filtrar apenas participantes com score > 0
 * 
 * @param ranked Array de participações ranqueadas
 * @returns Array filtrado apenas com participantes com score > 0
 */
export function filterPodiumParticipants<T>(
  ranked: RankedParticipation<T>[]
): RankedParticipation<T>[] {
  return ranked.filter(r => r.score > 0)
}

/**
 * Obtém participantes do pódio (Top 3 posições reais, respeitando empates)
 * MODIFIQUEI AQUI - Função para obter participantes do pódio respeitando empates
 * 
 * @param ranked Array de participações ranqueadas (já filtrado por score > 0)
 * @returns Array com participantes das 3 primeiras posições (pode ter mais de 3 se houver empates)
 */
export function getPodiumParticipants<T>(
  ranked: RankedParticipation<T>[]
): RankedParticipation<T>[] {
  const withScore = filterPodiumParticipants(ranked)
  if (withScore.length === 0) return []

  // Pegar todas as participações das 3 primeiras posições (incluindo empates)
  const positionsToShow = new Set<number>()
  withScore.forEach(r => {
    if (r.position <= 3) {
      positionsToShow.add(r.position)
    }
  })

  // Pegar todas as participações que ocupam essas posições
  return withScore.filter(r => positionsToShow.has(r.position))
}

/**
 * Obtém o texto da posição formatado
 * MODIFIQUEI AQUI - Função para formatar texto da posição
 * 
 * @param position Posição numérica
 * @returns Texto formatado (ex: "1º Lugar", "2º Lugar")
 */
export function getPositionLabel(position: number): string {
  return `${position}º Lugar`
}
