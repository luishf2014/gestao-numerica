/**
 * Componente de Badge de Status do Concurso
 * 
 * Exibe o status do concurso baseado no novo fluxo:
 * - Aceitando Participações
 * - Aguardando Resultado
 * - Finalizado
 */
import { Contest } from '../types'
import { getContestState } from '../utils/contestHelpers'

interface ContestStatusBadgeProps {
  contest: Contest
  hasDraws?: boolean
  variant?: 'default' | 'compact' | 'card'
  className?: string
}

export default function ContestStatusBadge({ 
  contest, 
  hasDraws = false, 
  variant = 'default',
  className = ''
}: ContestStatusBadgeProps) {
  const state = getContestState(contest, hasDraws)

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'px-2 py-0.5 text-xs'
      case 'card':
        return 'px-2 sm:px-3 py-1 text-xs'
      default:
        return 'px-3 sm:px-4 py-1.5 sm:py-2 text-base sm:text-lg'
    }
  }

  const getStateStyles = () => {
    switch (state.phase) {
      case 'finished':
        return 'bg-[#1F1F1F]/10 text-[#1F1F1F]/70'
      case 'accepting':
        return 'bg-[#3CCB7F]/20 text-[#1E7F43]'
      case 'awaiting_result':
        return 'bg-[#F4C430]/20 text-[#1F1F1F]'
      case 'upcoming':
        return 'bg-[#E5E5E5] text-[#1F1F1F]/60'
      default:
        return 'bg-[#E5E5E5] text-[#1F1F1F]/60'
    }
  }

  const getPrefix = () => {
    if (variant === 'card') {
      return state.phase === 'accepting' || state.phase === 'finished' ? '● ' : ''
    }
    return ''
  }

  return (
    <span className={`${getVariantStyles()} ${getStateStyles()} rounded-full font-semibold whitespace-nowrap inline-block ${className}`}>
      {getPrefix()}{state.label}
    </span>
  )
}
