/**
 * Helpers para cálculos de ranking
 * FASE 2: Participações e Ranking
 * 
 * Funções auxiliares para calcular acertos e preparar dados para ranking
 */

/**
 * Calcula a quantidade de acertos entre números sorteados e números da participação
 * CHATGPT: Base para ranking - calcula interseção entre arrays
 * 
 * @param drawNumbers Números sorteados no draw
 * @param participationNumbers Números escolhidos na participação
 * @returns Quantidade de acertos (interseção)
 */
export function calculateHits(
  drawNumbers: number[],
  participationNumbers: number[]
): number {
  const drawSet = new Set(drawNumbers)
  const hits = participationNumbers.filter((num) => drawSet.has(num))
  return hits.length
}

/**
 * Retorna os números que foram acertados
 * CHATGPT: Útil para destacar números acertados na UI
 * 
 * @param drawNumbers Números sorteados no draw
 * @param participationNumbers Números escolhidos na participação
 * @returns Array com os números acertados (ordenados)
 */
export function getHitNumbers(
  drawNumbers: number[],
  participationNumbers: number[]
): number[] {
  const drawSet = new Set(drawNumbers)
  return participationNumbers
    .filter((num) => drawSet.has(num))
    .sort((a, b) => a - b)
}

/**
 * Calcula a pontuação total de uma participação baseada em todos os sorteios
 * MODIFIQUEI AQUI - Função para calcular pontuação total somando acertos de todos os sorteios
 * 
 * @param participationNumbers Números escolhidos na participação
 * @param draws Array com todos os sorteios realizados
 * @returns Pontuação total (soma de todos os acertos em todos os sorteios)
 */
export function calculateTotalScore(
  participationNumbers: number[],
  draws: Array<{ numbers: number[] }>
): number {
  if (draws.length === 0) return 0
  
  let totalScore = 0
  draws.forEach(draw => {
    const hits = calculateHits(draw.numbers, participationNumbers)
    totalScore += hits
  })
  
  return totalScore
}

/**
 * Retorna todos os números acertados considerando todos os sorteios
 * MODIFIQUEI AQUI - Função para obter todos os números acertados de todos os sorteios
 * 
 * @param participationNumbers Números escolhidos na participação
 * @param draws Array com todos os sorteios realizados
 * @returns Array com todos os números únicos que foram acertados em qualquer sorteio
 */
export function getAllHitNumbers(
  participationNumbers: number[],
  draws: Array<{ numbers: number[] }>
): number[] {
  if (draws.length === 0) return []
  
  const allHitNumbers = new Set<number>()
  draws.forEach(draw => {
    const hits = getHitNumbers(draw.numbers, participationNumbers)
    hits.forEach(num => allHitNumbers.add(num))
  })
  
  return Array.from(allHitNumbers).sort((a, b) => a - b)
}
