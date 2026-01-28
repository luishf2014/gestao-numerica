/**
 * Calculadora de Rateio
 * FASE 4: Sorteios e Rateio
 * 
 * Calcula distribuição de prêmios baseado nas regras configuráveis
 */

export interface RateioConfig {
  maiorPontuacao: number // Ex: 65%
  segundaMaiorPontuacao: number // Ex: 10%
  menorPontuacao: number // Ex: 7%
  taxaAdministrativa: number // Ex: 18%
}

export interface RateioResult {
  totalArrecadado: number
  taxaAdministrativa: number
  valorPremiacao: number
  distribuicao: Array<{
    categoria: string
    pontuacao: number
    quantidadeGanhadores: number
    valorPorGanhador: number
    valorTotal: number
    percentual: number
  }>
  ganhadores: Array<{
    userId: string
    userName: string
    participationId: string
    ticketCode?: string
    pontuacao: number
    categoria: string
    valorPremio: number
  }>
}

// MODIFIQUEI AQUI - Interface para resultado de prêmios por draw
export interface DrawPayoutResult {
  maxScore: number // Maior pontuação do sorteio (0 = nenhum ganhador)
  categories: {
    TOP: {
      score: number
      winnersCount: number
      amountPerWinner: number
      totalAmount: number
    } | null
    SECOND: {
      score: number
      winnersCount: number
      amountPerWinner: number
      totalAmount: number
    } | null
    LOWEST: {
      score: number
      winnersCount: number
      amountPerWinner: number
      totalAmount: number
    } | null
  }
  payouts: Array<{
    participationId: string
    userId: string
    category: 'TOP' | 'SECOND' | 'LOWEST' | 'NONE'
    score: number
    amountWon: number
  }>
}

/**
 * Calcula o rateio baseado nas participações e sorteios
 * MODIFIQUEI AQUI - Função para calcular rateio
 * 
 * @param participations Participações com pontuação
 * @param totalRevenue Total arrecadado
 * @param config Configuração de percentuais (padrão do README)
 */
export function calculateRateio(
  participations: Array<{ current_score: number; user_id: string; id: string; ticket_code?: string; user?: { name: string } | null }>,
  totalRevenue: number,
  config: RateioConfig = {
    maiorPontuacao: 65,
    segundaMaiorPontuacao: 10,
    menorPontuacao: 7,
    taxaAdministrativa: 18,
  }
): RateioResult {
  // Validar que soma dos percentuais seja 100%
  const totalPercent = config.maiorPontuacao + config.segundaMaiorPontuacao + config.menorPontuacao + config.taxaAdministrativa
  if (Math.abs(totalPercent - 100) > 0.01) {
    throw new Error(`A soma dos percentuais deve ser 100%. Atual: ${totalPercent}%`)
  }

  // Calcular valores
  const taxaAdministrativa = (totalRevenue * config.taxaAdministrativa) / 100

  // MODIFIQUEI AQUI - valorPremiacao agora é a SOMA DAS CATEGORIAS (TOP/SECOND/LOWEST) calculadas sobre o TOTAL,
  // e não "total - taxa". Isso garante que 65/10/7/18 sempre bata 100% do total.
  const valorPremiacao = (totalRevenue * (config.maiorPontuacao + config.segundaMaiorPontuacao + config.menorPontuacao)) / 100

  // Agrupar por pontuação
  const pontuacoes = participations
    .map(p => p.current_score)
    .filter(score => score > 0)
    .sort((a, b) => b - a) // Ordenar decrescente

  if (pontuacoes.length === 0) {
    return {
      totalArrecadado: totalRevenue,
      taxaAdministrativa,
      // MODIFIQUEI AQUI - se não há ganhadores, não há premiação distribuída
      valorPremiacao: 0,
      distribuicao: [],
      ganhadores: [],
    }
  }

  const maiorPontuacao = pontuacoes[0]
  const segundaMaiorPontuacao = pontuacoes.find(p => p < maiorPontuacao) || null
  const menorPontuacao = pontuacoes[pontuacoes.length - 1]

  // Calcular distribuição
  const distribuicao: RateioResult['distribuicao'] = []
  const ganhadores: RateioResult['ganhadores'] = []

  // Maior pontuação
  const ganhadoresMaior = participations.filter(p => p.current_score === maiorPontuacao)
  if (ganhadoresMaior.length > 0) {
    // MODIFIQUEI AQUI - percentuais aplicados sobre o TOTAL (não desconta admin antes)
    const valorTotal = (totalRevenue * config.maiorPontuacao) / 100
    const valorPorGanhador = valorTotal / ganhadoresMaior.length

    distribuicao.push({
      categoria: 'Maior Pontuação',
      pontuacao: maiorPontuacao,
      quantidadeGanhadores: ganhadoresMaior.length,
      valorPorGanhador,
      valorTotal,
      percentual: config.maiorPontuacao,
    })

    ganhadoresMaior.forEach(p => {
      ganhadores.push({
        userId: p.user_id,
        userName: p.user?.name || 'N/A',
        participationId: p.id,
        ticketCode: p.ticket_code,
        pontuacao: p.current_score,
        categoria: 'Maior Pontuação',
        valorPremio: valorPorGanhador,
      })
    })
  }

  // Segunda maior pontuação (se diferente da maior)
  if (segundaMaiorPontuacao && segundaMaiorPontuacao < maiorPontuacao) {
    const ganhadoresSegunda = participations.filter(p => p.current_score === segundaMaiorPontuacao)
    if (ganhadoresSegunda.length > 0) {
      // MODIFIQUEI AQUI - percentuais aplicados sobre o TOTAL (não desconta admin antes)
      const valorTotal = (totalRevenue * config.segundaMaiorPontuacao) / 100
      const valorPorGanhador = valorTotal / ganhadoresSegunda.length

      distribuicao.push({
        categoria: 'Segunda Maior Pontuação',
        pontuacao: segundaMaiorPontuacao,
        quantidadeGanhadores: ganhadoresSegunda.length,
        valorPorGanhador,
        valorTotal,
        percentual: config.segundaMaiorPontuacao,
      })

      ganhadoresSegunda.forEach(p => {
        ganhadores.push({
          userId: p.user_id,
          userName: p.user?.name || 'N/A',
          participationId: p.id,
          ticketCode: p.ticket_code,
          pontuacao: p.current_score,
          categoria: 'Segunda Maior Pontuação',
          valorPremio: valorPorGanhador,
        })
      })
    }
  }

  // Menor pontuação (se diferente das outras)
  if (menorPontuacao < (segundaMaiorPontuacao || maiorPontuacao)) {
    const ganhadoresMenor = participations.filter(p => p.current_score === menorPontuacao)
    if (ganhadoresMenor.length > 0) {
      // MODIFIQUEI AQUI - percentuais aplicados sobre o TOTAL (não desconta admin antes)
      const valorTotal = (totalRevenue * config.menorPontuacao) / 100
      const valorPorGanhador = valorTotal / ganhadoresMenor.length

      distribuicao.push({
        categoria: 'Menor Pontuação',
        pontuacao: menorPontuacao,
        quantidadeGanhadores: ganhadoresMenor.length,
        valorPorGanhador,
        valorTotal,
        percentual: config.menorPontuacao,
      })

      ganhadoresMenor.forEach(p => {
        ganhadores.push({
          userId: p.user_id,
          userName: p.user?.name || 'N/A',
          participationId: p.id,
          ticketCode: p.ticket_code,
          pontuacao: p.current_score,
          categoria: 'Menor Pontuação',
          valorPremio: valorPorGanhador,
        })
      })
    }
  }

  return {
    totalArrecadado: totalRevenue,
    taxaAdministrativa,
    valorPremiacao,
    distribuicao,
    ganhadores: ganhadores.sort((a, b) => b.pontuacao - a.pontuacao), // Ordenar por pontuação
  }
}

/**
 * Calcula prêmios por draw seguindo regras específicas: TOP, SECOND, LOWEST
 * MODIFIQUEI AQUI - Função para calcular prêmios por sorteio com categorias específicas
 * 
 * Regras CORRETAS:
 * - TOP: somente participações com score == numbers_per_participation (ex: 10/10)
 * - SECOND: somente participações com score == numbers_per_participation - 1 (ex: 9/10)
 * - LOWEST: menor pontuação POSITIVA (>0) entre todas as participações
 * - NONE: não premiado
 * - Se categoria não tiver ganhadores, NÃO redistribui o valor
 * - maxScore == 0 significa "Não houve ganhadores nesse sorteio"
 * 
 * @param participations Participações com pontuação calculada
 * @param totalRevenue Total arrecadado (pool)
 * @param config Configuração de percentuais
 * @param numbersPerParticipation Quantidade de números por participação (ex: 10)
 */
export function calculateDrawPayouts(
  participations: Array<{ 
    id: string
    user_id: string
    current_score: number
  }>,
  totalRevenue: number,
  config: RateioConfig,
  numbersPerParticipation: number
): DrawPayoutResult {
  // Validar que soma dos percentuais seja 100%
  const totalPercent = config.maiorPontuacao + config.segundaMaiorPontuacao + config.menorPontuacao + config.taxaAdministrativa
  if (Math.abs(totalPercent - 100) > 0.01) {
    throw new Error(`A soma dos percentuais deve ser 100%. Atual: ${totalPercent}%`)
  }

  // MODIFIQUEI AQUI - NÃO descontar taxa admin antes.
  // Admin é apenas mais uma fatia do total (18%), e TOP/SECOND/LOWEST são calculados sobre o TOTAL.
  const taxaAdministrativa = (totalRevenue * config.taxaAdministrativa) / 100

  // MODIFIQUEI AQUI - prizePool aqui representa apenas a soma potencial das categorias premiáveis (TOP+SECOND+LOWEST) sobre o TOTAL
  // (isso é útil para exibir no relatório), mas os cálculos por categoria abaixo já usam totalRevenue diretamente.
  const prizePool = (totalRevenue * (config.maiorPontuacao + config.segundaMaiorPontuacao + config.menorPontuacao)) / 100

  // MODIFIQUEI AQUI - Obter todas as pontuações positivas ordenadas
  const scores = participations
    .map(p => p.current_score)
    .filter(score => score > 0)
    .sort((a, b) => b - a) // Ordenar decrescente

  const maxScore = scores.length > 0 ? scores[0] : 0

  // Se maxScore == 0, não há ganhadores
  if (maxScore === 0) {
    return {
      maxScore: 0,
      categories: {
        TOP: null,
        SECOND: null,
        LOWEST: null,
      },
      payouts: participations.map(p => ({
        participationId: p.id,
        userId: p.user_id,
        category: 'NONE' as const,
        score: p.current_score,
        amountWon: 0,
      })),
    }
  }

  // MODIFIQUEI AQUI - Determinar pontuações por categoria usando numbers_per_participation
  const topScore = numbersPerParticipation // Ex: 10/10
  const secondScore = numbersPerParticipation - 1 // Ex: 9/10
  const lowestScore = scores[scores.length - 1] // Menor pontuação positiva

  // MODIFIQUEI AQUI - Filtrar ganhadores baseado em pontuação exata
  const topWinners = participations.filter(p => p.current_score === topScore)
  const secondWinners = participations.filter(p => p.current_score === secondScore)
  // MODIFIQUEI AQUI - LOWEST só premia se pontuação for menor que SECOND
  const lowestWinners = lowestScore > 0 && lowestScore < secondScore
    ? participations.filter(p => p.current_score === lowestScore)
    : []

  // MODIFIQUEI AQUI - Calcular prêmios (NÃO redistribui se não houver ganhadores)
  // Agora calculado sobre o TOTAL (totalRevenue), e não sobre totalRevenue - taxa.
  const prizeTop = topWinners.length > 0 
    ? (totalRevenue * config.maiorPontuacao) / 100 
    : 0
  const prizeSecond = secondWinners.length > 0
    ? (totalRevenue * config.segundaMaiorPontuacao) / 100 
    : 0
  // MODIFIQUEI AQUI - LOWEST só calcula prêmio se houver ganhadores E pontuação < secondScore
  const prizeLowest = lowestWinners.length > 0 && lowestScore > 0 && lowestScore < secondScore
    ? (totalRevenue * config.menorPontuacao) / 100 
    : 0

  // MODIFIQUEI AQUI - Montar resultado das categorias
  const categories = {
    TOP: topWinners.length > 0 ? {
      score: topScore,
      winnersCount: topWinners.length,
      amountPerWinner: prizeTop / topWinners.length,
      totalAmount: prizeTop,
    } : null,
    SECOND: secondWinners.length > 0 ? {
      score: secondScore,
      winnersCount: secondWinners.length,
      amountPerWinner: prizeSecond / secondWinners.length,
      totalAmount: prizeSecond,
    } : null,
    LOWEST: lowestWinners.length > 0 && lowestScore > 0 && lowestScore < secondScore ? {
      score: lowestScore,
      winnersCount: lowestWinners.length,
      amountPerWinner: prizeLowest / lowestWinners.length,
      totalAmount: prizeLowest,
    } : null,
  }

  // MODIFIQUEI AQUI - Montar payouts por participação usando pontuações exatas
  const payouts = participations.map(p => {
    let category: 'TOP' | 'SECOND' | 'LOWEST' | 'NONE' = 'NONE'
    let amountWon = 0

    if (p.current_score === topScore && topWinners.length > 0) {
      category = 'TOP'
      amountWon = prizeTop / topWinners.length
    } else if (p.current_score === secondScore && secondWinners.length > 0) {
      category = 'SECOND'
      amountWon = prizeSecond / secondWinners.length
    } else if (lowestScore > 0 && lowestScore < secondScore && p.current_score === lowestScore && lowestWinners.length > 0) {
      category = 'LOWEST'
      amountWon = prizeLowest / lowestWinners.length
    }

    return {
      participationId: p.id,
      userId: p.user_id,
      category,
      score: p.current_score,
      amountWon,
    }
  })

  return {
    maxScore,
    categories,
    payouts,
  }
}
