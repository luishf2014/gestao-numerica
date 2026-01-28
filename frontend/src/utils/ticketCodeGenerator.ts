/**
 * Gerador de código/ticket único para participações
 * FASE 1: Fundação do Sistema
 * 
 * MODIFIQUEI AQUI - Gera códigos no formato: TK-XXXXXX
 * Exemplo: TK-A1B2C3
 */

/**
 * Gera um código único para participação
 * Formato: TK-XXXXXX
 * 
 * MODIFIQUEI AQUI - Função para gerar código único de ticket (sem data)
 * @returns Código único no formato TK-XXXXXX
 */
export function generateTicketCode(): string {
  // 6 caracteres alfanuméricos aleatórios (maiúsculas e números)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomPart = ''
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return `TK-${randomPart}`
}

/**
 * Valida se um código de ticket está no formato correto
 * 
 * MODIFIQUEI AQUI - Validação de formato de código de ticket (sem data)
 * @param code Código a ser validado
 * @returns true se o formato está correto
 */
export function isValidTicketCode(code: string): boolean {
  const pattern = /^TK-[A-Z0-9]{6}$/
  return pattern.test(code)
}
