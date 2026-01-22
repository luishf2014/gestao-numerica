/**
 * Tipos TypeScript do domínio
 * 
 * Baseado no modelo de domínio definido em docs/01_domain_model.md
 * 
 * FASE 1: Tipos básicos apenas
 * Fases futuras: Expandir conforme necessário
 */

// ============================================
// Usuário
// ============================================
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

// ============================================
// Concurso
// ============================================
export type ContestStatus = 'draft' | 'active' | 'finished' | 'cancelled'

export interface Contest {
  id: string
  name: string
  description?: string
  min_number: number
  max_number: number
  numbers_per_participation: number
  start_date: string
  end_date: string
  status: ContestStatus
  participation_value?: number
  created_by: string
  created_at: string
  updated_at: string
}

// ============================================
// Participação
// ============================================
export type ParticipationStatus = 'pending' | 'active' | 'cancelled'

export interface Participation {
  id: string
  contest_id: string
  user_id: string
  numbers: number[]
  status: ParticipationStatus
  current_score: number
  created_at: string
  updated_at: string
}

// ============================================
// Sorteio
// ============================================
export interface Draw {
  id: string
  contest_id: string
  numbers: number[]
  draw_date: string
  created_at: string
}

// ============================================
// Pagamento
// ============================================
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'
export type PaymentMethod = 'pix' | 'cash' | 'manual'

export interface Payment {
  id: string
  participation_id: string
  amount: number
  status: PaymentStatus
  payment_method?: PaymentMethod
  external_id?: string
  external_data?: Record<string, unknown>
  paid_at?: string
  created_at: string
  updated_at: string
}
