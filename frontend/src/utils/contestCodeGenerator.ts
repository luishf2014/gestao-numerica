/**
 * Gerador de código único para concursos
 * FASE 1: Fundação do Sistema
 * 
 * MODIFIQUEI AQUI - Gera códigos no formato: SIGLA-XXXXXX
 * Exemplo: CO-A1B2C3 (para "CONCURSO") ou MG-A1B2C3 (para "MEGA GIRO")
 */

/**
 * Extrai a sigla do nome do concurso
 * MODIFIQUEI AQUI - Função para extrair sigla baseada no nome
 * - Se for uma palavra: pega as 2 primeiras letras (ex: CONCURSO -> CO)
 * - Se for 2 ou mais palavras: pega a primeira letra de cada palavra (ex: MEGA GIRO -> MG)
 * 
 * @param contestName Nome do concurso
 * @returns Sigla de 2 letras maiúsculas
 */
export function extractContestInitials(contestName: string): string {
  if (!contestName || contestName.trim().length === 0) {
    return 'CG' // Fallback padrão
  }

  // Remove espaços extras e divide em palavras
  const words = contestName.trim().toUpperCase().split(/\s+/).filter(word => word.length > 0)
  
  if (words.length === 0) {
    return 'CG' // Fallback padrão
  }

  if (words.length === 1) {
    // Uma palavra: pega as 2 primeiras letras
    const word = words[0]
    if (word.length >= 2) {
      return word.substring(0, 2)
    } else {
      // Se a palavra tiver apenas 1 letra, repete ela
      return word + word
    }
  } else {
    // 2 ou mais palavras: pega a primeira letra de cada palavra
    return words.map(word => word.charAt(0)).join('').substring(0, 2)
  }
}

/**
 * Gera um código único para concurso
 * Formato: SIGLA-XXXXXX
 * 
 * MODIFIQUEI AQUI - Função para gerar código único de concurso usando sigla do nome
 * @param contestName Nome do concurso para extrair a sigla
 * @returns Código único no formato SIGLA-XXXXXX
 */
export function generateContestCode(contestName: string): string {
  // Extrair sigla do nome do concurso
  const initials = extractContestInitials(contestName)

  // 6 caracteres alfanuméricos aleatórios (maiúsculas e números)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomPart = ''
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return `${initials}-${randomPart}`
}

/**
 * Valida se um código de concurso está no formato correto
 * 
 * MODIFIQUEI AQUI - Validação de formato de código de concurso (aceita qualquer sigla de 2 letras)
 * @param code Código a ser validado
 * @returns true se o formato está correto
 */
export function isValidContestCode(code: string): boolean {
  const pattern = /^[A-Z]{2}-[A-Z0-9]{6}$/
  return pattern.test(code)
}
