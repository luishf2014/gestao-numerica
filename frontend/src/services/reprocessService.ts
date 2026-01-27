/**
 * Serviço de Reprocessamento de Concursos
 * FASE 4: Sorteios e Rateio
 * 
 * Centraliza a lógica de reprocessamento após criação/edição/exclusão de sorteios
 * MODIFIQUEI AQUI - Serviço para reprocessar acertos, pontuações e rateio
 */
import { supabase } from '../lib/supabase'
import { listDrawsByContestId, getDrawById } from './drawsService'
import { calculateTotalScore } from '../utils/rankingHelpers'
import { calculateRateio, calculateDrawPayouts, RateioConfig } from '../utils/rateioCalculator'

/**
 * Reprocessa um concurso após mudanças em sorteios
 * MODIFIQUEI AQUI - Função central para reprocessar acertos, pontuações e rateio
 * 
 * @param contestId ID do concurso a ser reprocessado
 */
export async function reprocessContestAfterDraw(contestId: string): Promise<void> {
  console.log(`[reprocessService] Iniciando reprocessamento do concurso ${contestId}...`)

  try {
    // 1. Buscar todas as participações ativas do concurso
    const { data: participations, error: participationsError } = await supabase
      .from('participations')
      .select('id, numbers, current_score, user_id, ticket_code, profiles:user_id(name)')
      .eq('contest_id', contestId)
      .eq('status', 'active') // Apenas participações ativas

    if (participationsError) {
      throw new Error(`Erro ao buscar participações: ${participationsError.message}`)
    }

    if (!participations || participations.length === 0) {
      console.log(`[reprocessService] Nenhuma participação ativa encontrada para o concurso ${contestId}`)
      return
    }

    // 2. Buscar todos os sorteios do concurso
    const draws = await listDrawsByContestId(contestId)

    if (draws.length === 0) {
      console.log(`[reprocessService] Nenhum sorteio encontrado. Zerando pontuações...`)
      // Se não há sorteios, zerar todas as pontuações
      await Promise.all(
        participations.map(async (participation: any) => {
          await supabase
            .from('participations')
            .update({ current_score: 0, updated_at: new Date().toISOString() })
            .eq('id', participation.id)
        })
      )
      return
    }

    // 3. Buscar informações do concurso (para percentuais de premiação)
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('id, first_place_pct, second_place_pct, lowest_place_pct, admin_fee_pct, participation_value')
      .eq('id', contestId)
      .single()

    if (contestError || !contest) {
      console.warn(`[reprocessService] Erro ao buscar concurso, usando valores padrão:`, contestError)
    }

    // 4. Calcular nova pontuação para cada participação
    const updates: Array<{ id: string; score: number }> = []
    
    participations.forEach((participation: any) => {
      const newScore = calculateTotalScore(participation.numbers, draws)
      updates.push({
        id: participation.id,
        score: newScore,
      })
    })

    // 5. Atualizar current_score de todas as participações em batch
    console.log(`[reprocessService] Atualizando ${updates.length} participações...`)
    
    await Promise.all(
      updates.map(async (update) => {
        const { error } = await supabase
          .from('participations')
          .update({
            current_score: update.score,
            updated_at: new Date().toISOString(),
          })
          .eq('id', update.id)

        if (error) {
          console.error(`[reprocessService] Erro ao atualizar participação ${update.id}:`, error)
        }
      })
    )

    console.log(`[reprocessService] Pontuações atualizadas com sucesso`)

    // 6. MODIFIQUEI AQUI - Processar prêmios para cada sorteio individualmente
    for (const draw of draws) {
      try {
        await reprocessDrawResults(draw.id)
      } catch (drawError) {
        console.error(`[reprocessService] Erro ao processar prêmios do sorteio ${draw.id}:`, drawError)
        // Continuar processando outros sorteios mesmo se um falhar
      }
    }

    // 7. Calcular e salvar snapshot de rateio (apenas se houver sorteios e participações com pontuação > 0)
    const participationsWithScore = participations.filter((p: any) => {
      const update = updates.find(u => u.id === p.id)
      return update && update.score > 0
    })

    if (participationsWithScore.length > 0 && draws.length > 0) {
      // Buscar total arrecadado (soma de pagamentos pagos)
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .in('participation_id', participations.map((p: any) => p.id))

      if (paymentsError) {
        console.warn(`[reprocessService] Erro ao buscar pagamentos para rateio:`, paymentsError)
      }

      const totalArrecadado = payments && !paymentsError
        ? payments.reduce((sum, p) => sum + Number(p.amount), 0)
        : 0

      if (totalArrecadado > 0) {
        console.log(`[reprocessService] Calculando rateio para ${participationsWithScore.length} participações com pontuação. Total arrecadado: R$ ${totalArrecadado.toFixed(2)}`)
        // Preparar configuração de rateio (usar valores do concurso ou padrão)
        const rateioConfig: RateioConfig = {
          maiorPontuacao: contest?.first_place_pct || 65,
          segundaMaiorPontuacao: contest?.second_place_pct || 10,
          menorPontuacao: contest?.lowest_place_pct || 7,
          taxaAdministrativa: contest?.admin_fee_pct || 18,
        }

        // Preparar participações com pontuação atualizada
        // MODIFIQUEI AQUI - Corrigir acesso ao relacionamento profiles
        const participationsForRateio = participationsWithScore.map((p: any) => {
          const update = updates.find(u => u.id === p.id)
          const profileData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
          return {
            current_score: update?.score || 0,
            user_id: p.user_id,
            id: p.id,
            ticket_code: p.ticket_code,
            user: profileData ? { name: profileData.name } : null,
          }
        })

        // Calcular rateio
        const rateioResult = calculateRateio(participationsForRateio, totalArrecadado, rateioConfig)

        // Salvar snapshot do rateio (usar o último sorteio como referência)
        const lastDraw = draws[draws.length - 1]
        
        const { error: snapshotError } = await supabase
          .from('rateio_snapshots')
          .insert({
            contest_id: contestId,
            draw_id: lastDraw.id,
            total_arrecadado: rateioResult.totalArrecadado,
            taxa_administrativa: rateioResult.taxaAdministrativa,
            valor_premiacao: rateioResult.valorPremiacao,
            first_place_pct: rateioConfig.maiorPontuacao,
            second_place_pct: rateioConfig.segundaMaiorPontuacao,
            lowest_place_pct: rateioConfig.menorPontuacao,
            admin_fee_pct: rateioConfig.taxaAdministrativa,
            distribuicao: rateioResult.distribuicao,
            ganhadores: rateioResult.ganhadores,
          })

        if (snapshotError) {
          console.error(`[reprocessService] Erro ao salvar snapshot de rateio:`, snapshotError)
          // Não falhar o reprocessamento se o snapshot falhar
        } else {
          console.log(`[reprocessService] Snapshot de rateio salvo com sucesso para sorteio ${lastDraw.id}`)
        }
      } else {
        console.log(`[reprocessService] Rateio não calculado: total arrecadado é zero (R$ 0,00)`)
      }
    } else {
      if (participationsWithScore.length === 0) {
        console.log(`[reprocessService] Rateio não calculado: nenhuma participação com pontuação > 0`)
      }
      if (draws.length === 0) {
        console.log(`[reprocessService] Rateio não calculado: nenhum sorteio encontrado`)
      }
    }

    console.log(`[reprocessService] Reprocessamento do concurso ${contestId} concluído com sucesso`)
  } catch (error) {
    console.error(`[reprocessService] Erro ao reprocessar concurso ${contestId}:`, error)
    throw error
  }
}

/**
 * Reprocessa um sorteio específico e calcula/salva prêmios por participação
 * MODIFIQUEI AQUI - Função para processar prêmios por draw individual
 * 
 * @param drawId ID do sorteio a ser processado
 */
export async function reprocessDrawResults(drawId: string): Promise<void> {
  console.log(`[reprocessService] Iniciando processamento de prêmios para sorteio ${drawId}...`)

  try {
    // 1. Buscar dados do sorteio
    const draw = await getDrawById(drawId)
    if (!draw) {
      throw new Error(`Sorteio ${drawId} não encontrado`)
    }

    // 2. Buscar informações do concurso
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('id, first_place_pct, second_place_pct, lowest_place_pct, admin_fee_pct, participation_value')
      .eq('id', draw.contest_id)
      .single()

    if (contestError || !contest) {
      throw new Error(`Erro ao buscar concurso: ${contestError?.message || 'Concurso não encontrado'}`)
    }

    // 3. Buscar todas as participações ativas do concurso
    const { data: participations, error: participationsError } = await supabase
      .from('participations')
      .select('id, numbers, current_score, user_id, ticket_code')
      .eq('contest_id', draw.contest_id)
      .eq('status', 'active')

    if (participationsError) {
      throw new Error(`Erro ao buscar participações: ${participationsError.message}`)
    }

    if (!participations || participations.length === 0) {
      console.log(`[reprocessService] Nenhuma participação ativa encontrada`)
      // Limpar payouts existentes deste draw
      await supabase.from('draw_payouts').delete().eq('draw_id', drawId)
      return
    }

    // 4. Calcular pontuação de cada participação para este sorteio específico
    const participationsWithScore = participations.map(p => ({
      id: p.id,
      user_id: p.user_id,
      current_score: calculateTotalScore(p.numbers, [draw]), // Pontuação apenas deste sorteio
    }))

    // 5. Buscar total arrecadado
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .in('participation_id', participations.map(p => p.id))

    if (paymentsError) {
      console.warn(`[reprocessService] Erro ao buscar pagamentos:`, paymentsError)
    }

    const totalArrecadado = payments && !paymentsError
      ? payments.reduce((sum, p) => sum + Number(p.amount), 0)
      : 0

    // 6. Calcular prêmios usando a nova função
    const rateioConfig: RateioConfig = {
      maiorPontuacao: contest.first_place_pct || 65,
      segundaMaiorPontuacao: contest.second_place_pct || 10,
      menorPontuacao: contest.lowest_place_pct || 7,
      taxaAdministrativa: contest.admin_fee_pct || 18,
    }

    const payoutResult = calculateDrawPayouts(
      participationsWithScore,
      totalArrecadado,
      rateioConfig
    )

    // 7. MODIFIQUEI AQUI - Deletar payouts existentes deste draw (idempotência)
    await supabase.from('draw_payouts').delete().eq('draw_id', drawId)

    // 8. Inserir novos payouts
    if (payoutResult.payouts.length > 0) {
      const payoutsToInsert = payoutResult.payouts.map(payout => ({
        draw_id: drawId,
        contest_id: draw.contest_id,
        participation_id: payout.participationId,
        user_id: payout.userId,
        category: payout.category,
        score: payout.score,
        amount_won: payout.amountWon,
      }))

      const { error: insertError } = await supabase
        .from('draw_payouts')
        .insert(payoutsToInsert)

      if (insertError) {
        console.error(`[reprocessService] Erro ao salvar payouts:`, insertError)
        throw insertError
      }

      console.log(`[reprocessService] ${payoutsToInsert.length} payouts salvos para sorteio ${drawId}`)
    } else {
      console.log(`[reprocessService] Nenhum payout para salvar (sem ganhadores)`)
    }

    console.log(`[reprocessService] Processamento de prêmios para sorteio ${drawId} concluído`)
  } catch (error) {
    console.error(`[reprocessService] Erro ao processar prêmios do sorteio ${drawId}:`, error)
    throw error
  }
}
