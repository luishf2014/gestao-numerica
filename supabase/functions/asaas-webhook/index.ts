/**
 * Edge Function: asaas-webhook
 *
 * Responsabilidade:
 * - Receber webhooks do Asaas
 * - Validar token de segurança
 * - Confirmar pagamento PIX
 * - Atualizar pagamento como "paid"
 * - Ativar participação automaticamente
 *
 * Segurança:
 * - Validação de token do webhook (ASAAS)
 * - Uso de Service Role (bypass RLS)
 * - Idempotência garantida
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, asaas-access-token, access_token',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface AsaasWebhookEvent {
  event?: string
  payment?: {
    id?: string
    status?: string
    paymentDate?: string
  }
  id?: string
  status?: string
  paymentDate?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    // 🔐 Token do webhook (ASAAS)
    const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN')

    const receivedToken =
      req.headers.get('asaas-access-token') ||
      req.headers.get('access_token')

    if (!webhookToken || receivedToken !== webhookToken) {
      console.warn('[asaas-webhook] token inválido')
      return jsonResponse({ error: 'Webhook não autorizado' }, 401)
    }

    const webhookData: AsaasWebhookEvent = await req.json()

    const paymentId = webhookData.payment?.id || webhookData.id
    const paymentStatus = webhookData.payment?.status || webhookData.status
    const paymentDate =
      webhookData.payment?.paymentDate ||
      webhookData.paymentDate ||
      new Date().toISOString()

    if (!paymentId || !paymentStatus) {
      return jsonResponse({ error: 'Webhook inválido: dados incompletos' }, 400)
    }

    console.log('[asaas-webhook] recebido:', {
      event: webhookData.event,
      paymentId,
      paymentStatus,
    })

    // ✅ Status válidos para confirmar pagamento PIX
    const validStatuses = ['RECEIVED', 'CONFIRMED', 'CREDITED']

    if (!validStatuses.includes(paymentStatus)) {
      return jsonResponse({ message: 'Evento ignorado' }, 200)
    }

    // Supabase Admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      Deno.env.get('SERVICE_ROLE_KEY') ||
      ''

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Configuração do Supabase inválida' }, 500)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: payment, error: payFindErr } = await supabase
      .from('payments')
      .select('id, participation_id, status')
      .eq('external_id', paymentId)
      .maybeSingle()

    if (payFindErr) {
      console.error('[asaas-webhook] erro find payment:', payFindErr)
      return jsonResponse({ error: 'Falha ao buscar pagamento' }, 500)
    }

    if (!payment) {
      console.log('[asaas-webhook] pagamento não encontrado:', paymentId)
      return jsonResponse({ message: 'Pagamento não encontrado' }, 200)
    }

    // 🔁 Idempotência
    if (payment.status === 'paid') {
      return jsonResponse({ message: 'Pagamento já processado' }, 200)
    }

    // Atualiza pagamento + participação
    const [payRes, partRes] = await Promise.all([
      supabase
        .from('payments')
        .update({ status: 'paid', paid_at: paymentDate })
        .eq('id', payment.id),

      supabase
        .from('participations')
        .update({ status: 'active' })
        .eq('id', payment.participation_id),
    ])

    if (payRes.error || partRes.error) {
      console.error('[asaas-webhook] erro update:', {
        pay: payRes.error,
        part: partRes.error,
      })
      return jsonResponse({ error: 'Erro ao atualizar registros' }, 500)
    }

    return jsonResponse({ message: 'Pagamento confirmado com sucesso' }, 200)
  } catch (error) {
    console.error('[asaas-webhook] erro inesperado:', error)
    return jsonResponse({ error: 'Erro interno do servidor' }, 500)
  }
})