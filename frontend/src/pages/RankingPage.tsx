/**
 * Página de Ranking de um Concurso
 * FASE 2: Participações e Ranking
 * 
 * Exibe o ranking de participantes ordenado por pontuação
 */
import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getContestById } from '../services/contestsService'
import { getContestRanking } from '../services/participationsService'
import { listDrawsByContestId } from '../services/drawsService'
import { getDrawPayoutSummary, getPayoutsByDraw } from '../services/payoutsService'
import { Contest, Participation, Draw } from '../types'
import { calculateTotalScore, getAllHitNumbers } from '../utils/rankingHelpers'
// MODIFIQUEI AQUI - Não usar getPayoutCategory para medalha/categoria/prêmio (agora é por SCORE)
// import { getPayoutCategory } from '../utils/payoutCategoryHelpers'
import { getContestState } from '../utils/contestHelpers'
import Header from '../components/Header'
import Footer from '../components/Footer'

interface ParticipationWithUser extends Participation {
  user: { id: string; name: string; email: string } | null
}

export default function RankingPage() {
  const { id } = useParams<{ id: string }>()
  const [contest, setContest] = useState<Contest | null>(null)
  const [participations, setParticipations] = useState<ParticipationWithUser[]>([])
  const [draws, setDraws] = useState<Draw[]>([])
  const [selectedDrawId, setSelectedDrawId] = useState<string>('')
  const [payoutSummary, setPayoutSummary] = useState<any>(null)
  const [payouts, setPayouts] = useState<Record<string, any>>({}) // participationId -> DrawPayout
  const [filter, setFilter] = useState<'all' | 'premiados' | 'TOP' | 'SECOND' | 'LOWEST' | 'nao_premiados'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRankingData() {
      if (!id) {
        setError('ID do concurso não fornecido')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log('MODIFIQUEI AQUI [RankingPage] loadRankingData START - contestId=', id)

        const [contestData, rankingData, drawsData] = await Promise.all([
          getContestById(id),
          getContestRanking(id),
          listDrawsByContestId(id),
        ])

        console.log('MODIFIQUEI AQUI [RankingPage] contestData exists=', !!contestData)
        console.log('MODIFIQUEI AQUI [RankingPage] rankingData.length=', rankingData?.length)
        console.log('MODIFIQUEI AQUI [RankingPage] drawsData.length=', drawsData?.length)

        if (drawsData?.length) {
          console.log(
            'MODIFIQUEI AQUI [RankingPage] drawsData RAW order (first 5)=',
            drawsData.slice(0, 5).map(d => ({
              id: d.id,
              draw_date: d.draw_date,
              code: d.code,
              numbersLen: d.numbers?.length,
              numbersPreview: (d.numbers || []).slice(0, 10),
            }))
          )
        }

        if (!contestData) {
          setError('Concurso não encontrado')
          return
        }

        setContest(contestData)
        console.log('AQUI[RankingPage] contest keys=', Object.keys(contestData || {}))
        console.log('AQUI[RankingPage] contest=', contestData)

        setParticipations(rankingData)
        setDraws(drawsData)

        if (drawsData.length > 0) {
          const lastDraw = drawsData[0] // Já ordenado por data desc
          console.log('MODIFIQUEI AQUI [RankingPage] lastDraw chosen (drawsData[0])=', {
            id: lastDraw.id,
            draw_date: lastDraw.draw_date,
            code: lastDraw.code,
            numbersLen: lastDraw.numbers?.length,
            numbers: lastDraw.numbers,
          })

          setSelectedDrawId(lastDraw.id)
          await loadDrawPayouts(lastDraw.id)
        } else {
          setSelectedDrawId('')
          setPayoutSummary(null)
          setPayouts({})
        }

        console.log('MODIFIQUEI AQUI [RankingPage] loadRankingData END')
      } catch (err) {
        console.error('MODIFIQUEI AQUI [RankingPage] loadRankingData ERROR=', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar ranking')
      } finally {
        setLoading(false)
      }
    }

    loadRankingData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadDrawPayouts = async (drawId: string) => {
    try {
      console.log('MODIFIQUEI AQUI [RankingPage] loadDrawPayouts drawId=', drawId)

      const [summary, drawPayouts] = await Promise.all([
        getDrawPayoutSummary(drawId),
        getPayoutsByDraw(drawId),
      ])

      console.log('MODIFIQUEI AQUI [RankingPage] payoutSummary=', summary)
      console.log('MODIFIQUEI AQUI [RankingPage] drawPayouts.length=', drawPayouts?.length)

      setPayoutSummary(summary)

      const payoutsMap: Record<string, any> = {}
      drawPayouts.forEach((p) => {
        payoutsMap[p.participation_id] = p
      })
      setPayouts(payoutsMap)
    } catch (err) {
      console.error('Erro ao carregar prêmios:', err)
    }
  }

  useEffect(() => {
    console.log('MODIFIQUEI AQUI [RankingPage] selectedDrawId changed =>', selectedDrawId)

    if (selectedDrawId) {
      loadDrawPayouts(selectedDrawId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDrawId])

  const drawsSortedAsc = useMemo(() => {
    const sorted = [...draws].sort((a, b) =>
      new Date(a.draw_date).getTime() - new Date(b.draw_date).getTime()
    )

    console.log(
      'MODIFIQUEI AQUI [RankingPage] drawsSortedAsc=',
      sorted.map(d => ({ id: d.id, draw_date: d.draw_date, code: d.code, numbers: d.numbers }))
    )

    return sorted
  }, [draws])

  const getDrawsUpTo = (drawId: string): Draw[] => {
    const idx = drawsSortedAsc.findIndex(d => d.id === drawId)

    console.log('MODIFIQUEI AQUI [RankingPage] getDrawsUpTo drawId=', drawId, 'idx=', idx)

    if (idx === -1) {
      console.log('MODIFIQUEI AQUI [RankingPage] getDrawsUpTo idx=-1 => returning FULL drawsSortedAsc (len)=', drawsSortedAsc.length)
      return drawsSortedAsc
    }

    const sliced = drawsSortedAsc.slice(0, idx + 1)
    console.log(
      'MODIFIQUEI AQUI [RankingPage] getDrawsUpTo returning sliced (len)=',
      sliced.length,
      'draws=',
      sliced.map(d => ({ id: d.id, draw_date: d.draw_date, code: d.code }))
    )
    return sliced
  }

  const getTotalScore = (participation: Participation): number => {
    const score = calculateTotalScore(participation.numbers, draws)
    console.log('MODIFIQUEI AQUI [RankingPage] getTotalScore participationId=', (participation as any)?.id, 'score=', score)
    return score
  }

  // testar aqui

  const getScoreUpToDraw = (participation: Participation, drawId: string): number => {
    // MODIFIQUEI AQUI - usar SOMENTE o sorteio selecionado (não acumulado)
    const drawOnly = draws.find(d => d.id === drawId)
    const drawsToUse = drawOnly ? [drawOnly] : []

    const score = calculateTotalScore(participation.numbers, drawsToUse)

    console.log(
      'MODIFIQUEI AQUI [RankingPage] getScoreUpToDraw(SINGLE)',
      'participationId=', participation.id,
      'drawId=', drawId,
      'drawsToUse.len=', drawsToUse.length,
      'drawsToUse.ids=', drawsToUse.map(d => d.id),
      'score=', score
    )

    return score
  }


  // testar aqui
  const drawnNumbersSorted = useMemo((): number[] => {
    // MODIFIQUEI AQUI - usar SOMENTE o sorteio selecionado (não acumulado)
    const drawOnly = selectedDrawId ? draws.find(d => d.id === selectedDrawId) : undefined
    const drawsToUse = drawOnly ? [drawOnly] : draws
  
    const allNumbers = new Set<number>()
    drawsToUse.forEach((draw) => {
      draw.numbers.forEach((num) => allNumbers.add(num))
    })
  
    const sorted = Array.from(allNumbers).sort((a, b) => a - b)
  
    console.log(
      'MODIFIQUEI AQUI [RankingPage] drawnNumbersSorted(SINGLE)',
      'selectedDrawId=', selectedDrawId,
      'drawsToUse.len=', drawsToUse.length,
      'drawsToUse.ids=', drawsToUse.map(d => d.id),
      'sorted=', sorted
    )
  
    return sorted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draws, selectedDrawId])
  

  const drawnNumbersSet = useMemo(() => new Set<number>(drawnNumbersSorted), [drawnNumbersSorted])

  const isNumberDrawn = (number: number): boolean => {
    return drawnNumbersSet.has(number)
  }


  // testar aqui

  const getHitNumbersForParticipation = (participation: Participation): number[] => {
    // MODIFIQUEI AQUI - usar SOMENTE o sorteio selecionado (não acumulado)
    const drawOnly = selectedDrawId ? draws.find(d => d.id === selectedDrawId) : undefined
    const drawsToUse = drawOnly ? [drawOnly] : draws
  
    const hits = getAllHitNumbers(participation.numbers, drawsToUse)
  
    console.log(
      'MODIFIQUEI AQUI [RankingPage] getHitNumbersForParticipation(SINGLE)',
      'participationId=', participation.id,
      'selectedDrawId=', selectedDrawId,
      'drawsToUse.len=', drawsToUse.length,
      'drawsToUse.ids=', drawsToUse.map(d => d.id),
      'drawNumbers=', drawOnly?.numbers,
      'participationNumbers=', participation.numbers,
      'hits=', hits
    )
  
    return hits
  }
  

  const maxScoreToDisplay = useMemo(() => {
    if (participations.length === 0) return 0

    let max = 0
    for (const p of participations) {
      const s = selectedDrawId ? getScoreUpToDraw(p, selectedDrawId) : getTotalScore(p)
      if (s > max) max = s
    }

    console.log('MODIFIQUEI AQUI [RankingPage] maxScoreToDisplay=', max, 'selectedDrawId=', selectedDrawId)

    return max
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participations, selectedDrawId, draws, drawsSortedAsc])

  // MODIFIQUEI AQUI - total arrecadado (summary se existir, senão fallback)
  const getTotalCollected = () => {
    const fromSummary =
      payoutSummary?.totalCollected ??
      payoutSummary?.total_amount ??
      payoutSummary?.totalAmount ??
      payoutSummary?.total_paid ??
      null

    if (fromSummary !== null && fromSummary !== undefined) {
      const n = Number(fromSummary)
      if (Number.isFinite(n) && n > 0) return n
    }

    // fallback: qtd participações * valor da participação
    const value = Number((contest as any)?.participation_value || 0)
    return Number.isFinite(value) ? participations.length * value : 0
  }

  // MODIFIQUEI AQUI - ler % do concurso (campos reais do schema)
  const getCategoryPercent = (category: 'TOP' | 'SECOND' | 'LOWEST') => {
    if (category === 'TOP') return Number((contest as any)?.first_place_pct ?? 0)
    if (category === 'SECOND') return Number((contest as any)?.second_place_pct ?? 0)
    if (category === 'LOWEST') return Number((contest as any)?.lowest_place_pct ?? 0)
    return 0
  }

  const calcAmountPerWinner = (
    category: 'TOP' | 'SECOND' | 'LOWEST',
    winnersCount: number
  ) => {
    if (winnersCount === 0) return 0

    const totalCollected = getTotalCollected()
    const percent = getCategoryPercent(category)

    const categoryTotal = totalCollected * (percent / 100)
    return categoryTotal / winnersCount
  }

  // MODIFIQUEI AQUI - calcular ganhadores por SCORE (sempre definido)
  const drawWinnersByScore = useMemo(() => {
    const N = Number(contest?.numbers_per_participation || 0)
    const topScore = Number.isFinite(N) ? N : null
    const secondScore = Number.isFinite(N) ? (N - 1) : null

    const scoreOf = (p: ParticipationWithUser) =>
      selectedDrawId ? getScoreUpToDraw(p, selectedDrawId) : getTotalScore(p)

    const allScores = participations.map((p) => scoreOf(p))

    const topWinnersCount =
      topScore !== null ? participations.filter((p) => scoreOf(p) === topScore).length : 0

    const secondWinnersCount =
      secondScore !== null ? participations.filter((p) => scoreOf(p) === secondScore).length : 0

    // LOWEST = menor pontuação positiva (>0) diferente de TOP e SECOND
    const positiveScores = allScores.filter(
      (s) => s > 0 && (topScore === null || s !== topScore) && (secondScore === null || s !== secondScore)
    )
    const lowestPositiveScore = positiveScores.length > 0 ? Math.min(...positiveScores) : null

    const lowestWinnersCount =
      lowestPositiveScore !== null ? participations.filter((p) => scoreOf(p) === lowestPositiveScore).length : 0

    const hasAnyWinner = topWinnersCount > 0 || secondWinnersCount > 0 || lowestWinnersCount > 0

    console.log('MODIFIQUEI AQUI [RankingPage] drawWinnersByScore=', {
      selectedDrawId,
      N,
      topScore,
      secondScore,
      lowestPositiveScore,
      topWinnersCount,
      secondWinnersCount,
      lowestWinnersCount,
      hasAnyWinner,
      allScoresPreview: allScores.slice(0, 10),
    })

    return {
      TOP: { score: topScore, winnersCount: topWinnersCount },
      SECOND: { score: secondScore, winnersCount: secondWinnersCount },
      LOWEST: { score: lowestPositiveScore, winnersCount: lowestWinnersCount },
      hasAnyWinner,
    }
  }, [contest, participations, selectedDrawId, draws]) // draws entra por causa do score  

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E7F43] mx-auto"></div>
            <p className="mt-4 text-[#1F1F1F]/70">Carregando ranking...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !contest) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2">⚠️ Erro</div>
            <p className="text-[#1F1F1F]/70 mb-4">{error || 'Concurso não encontrado'}</p>
            <Link to="/contests" className="text-[#1E7F43] hover:text-[#3CCB7F] underline font-semibold">
              Voltar para lista de concursos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const categoryLabels = {
    TOP: {
      title: 'MAIOR PONTUAÇÃO',
      subtitle: `(${contest?.numbers_per_participation || 'N'} acertos)`,
    },
    SECOND: {
      title: 'SEGUNDA MAIOR',
      subtitle: `(${contest && contest.numbers_per_participation ? contest.numbers_per_participation - 1 : 'N-1'} acertos)`,
    },
    LOWEST: {
      title: 'MENOR PONTUAÇÃO',
      subtitle: '(menor pontuação positiva)',
    },
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              to={`/contests/${contest.id}`}
              className="text-[#1E7F43] hover:text-[#3CCB7F] font-semibold flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para detalhes do concurso
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E5E5]">
            <h1 className="text-3xl font-extrabold text-[#1F1F1F] mb-2">🏆 Ranking - {contest.name}</h1>

            {contest.contest_code && (
              <div className="mb-3">
                <span className="px-3 py-1 bg-[#1E7F43] text-white rounded-full text-xs sm:text-sm font-mono font-semibold">
                  Código do Concurso: {contest.contest_code}
                </span>
              </div>
            )}

            <p className="text-[#1F1F1F]/70 mb-4">{contest.description || 'Classificação dos participantes por pontuação'}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-[#1E7F43] to-[#3CCB7F] rounded-xl p-4 text-white">
                <div className="text-sm font-semibold opacity-90 mb-1">Total de Participantes</div>
                <div className="text-3xl font-bold">{participations.length}</div>
              </div>
              <div className="bg-gradient-to-br from-[#F4C430] to-[#FFD700] rounded-xl p-4 text-[#1F1F1F]">
                <div className="text-sm font-semibold opacity-90 mb-1">Sorteios Realizados</div>
                <div className="text-3xl font-bold">{draws.length}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="text-sm font-semibold opacity-90 mb-1">Maior Pontuação</div>
                <div className="text-3xl font-bold">{maxScoreToDisplay}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Resultado do Sorteio */}
        {draws.length > 0 && selectedDrawId && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-[#E5E5E5]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1F1F1F]">🎯 Resultado do Sorteio</h2>
              {draws.length > 1 && (
                <select
                  value={selectedDrawId}
                  onChange={(e) => {
                    console.log('MODIFIQUEI AQUI [RankingPage] select onChange selectedDrawId =>', e.target.value)
                    setSelectedDrawId(e.target.value)
                  }}
                  className="px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E7F43]"
                >
                  {draws.map((draw) => (
                    <option key={draw.id} value={draw.id}>
                      {formatDateTime(draw.draw_date)} {draw.code ? `(${draw.code})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {payoutSummary && !drawWinnersByScore.hasAnyWinner ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">😔</div>
                <p className="text-lg font-semibold text-yellow-900">Não houve ganhadores neste sorteio.</p>
              </div>
            ) : payoutSummary ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1F1F1F] mb-3">Categorias Premiadas</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* TOP */}
                  <div
                    className={`rounded-xl p-4 border-2 ${drawWinnersByScore.TOP.winnersCount > 0
                      ? 'bg-gradient-to-br from-[#F4C430] to-[#FFD700] border-[#F4C430]'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="text-sm font-semibold mb-2">
                      {categoryLabels.TOP.title} {categoryLabels.TOP.subtitle}
                    </div>
                    {drawWinnersByScore.TOP.winnersCount > 0 ? (
                      <>
                        <div className="text-2xl font-bold mb-1">{drawWinnersByScore.TOP.score} acertos</div>
                        <div className="text-sm mb-2">{drawWinnersByScore.TOP.winnersCount} ganhador(es)</div>
                        <div className="text-lg font-bold">
                          R$ {Number(calcAmountPerWinner('TOP', drawWinnersByScore.TOP.winnersCount) || 0).toFixed(2).replace('.', ',')}
                        </div>
                        <div className="text-xs opacity-75 mt-1">por ganhador</div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-600">Sem ganhadores</div>
                    )}
                  </div>

                  {/* SECOND */}
                  <div
                    className={`rounded-xl p-4 border-2 ${drawWinnersByScore.SECOND.winnersCount > 0
                      ? 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="text-sm font-semibold mb-2">
                      {categoryLabels.SECOND.title} {categoryLabels.SECOND.subtitle}
                    </div>
                    {drawWinnersByScore.SECOND.winnersCount > 0 ? (
                      <>
                        <div className="text-2xl font-bold mb-1">{drawWinnersByScore.SECOND.score} acertos</div>
                        <div className="text-sm mb-2">{drawWinnersByScore.SECOND.winnersCount} ganhador(es)</div>
                        <div className="text-lg font-bold">
                          R$ {Number(calcAmountPerWinner('SECOND', drawWinnersByScore.SECOND.winnersCount) || 0).toFixed(2).replace('.', ',')}
                        </div>
                        <div className="text-xs opacity-75 mt-1">por ganhador</div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-600">Sem ganhadores</div>
                    )}
                  </div>

                  {/* LOWEST */}
                  <div
                    className={`rounded-xl p-4 border-2 ${drawWinnersByScore.LOWEST.winnersCount > 0
                      ? 'bg-gradient-to-br from-orange-200 to-orange-300 border-orange-400'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="text-sm font-semibold mb-2">
                      {categoryLabels.LOWEST.title} {categoryLabels.LOWEST.subtitle}
                    </div>
                    {drawWinnersByScore.LOWEST.winnersCount > 0 ? (
                      <>
                        <div className="text-2xl font-bold mb-1">{drawWinnersByScore.LOWEST.score} acertos</div>
                        <div className="text-sm mb-2">{drawWinnersByScore.LOWEST.winnersCount} ganhador(es)</div>
                        <div className="text-lg font-bold">
                          R$ {Number(calcAmountPerWinner('LOWEST', drawWinnersByScore.LOWEST.winnersCount) || 0).toFixed(2).replace('.', ',')}
                        </div>
                        <div className="text-xs opacity-75 mt-1">por ganhador</div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-600">Sem ganhadores</div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Como funciona a premiação:</strong> este concurso premia apenas as categorias configuradas
                    (maior pontuação, segunda maior e menor pontuação positiva). Pontuações intermediárias podem não receber prêmio.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-[#1F1F1F]/60">Carregando resultado do sorteio...</div>
            )}
          </div>
        )}

        {/* Informações sobre sorteios */}
        {draws.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-[#E5E5E5]">
            <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">📊 Últimos Sorteios</h2>
            <div className="space-y-3">
              {draws.slice(0, 3).map((draw) => (
                <div key={draw.id} className="flex items-center justify-between p-3 bg-[#F9F9F9] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#1E7F43] text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                      {draw.code?.split('-')[2]?.substring(0, 2) || 'DRW'}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1F1F1F]">{formatDateTime(draw.draw_date)}</div>
                      <div className="text-sm text-[#1F1FF]/70">{draw.numbers.length} números sorteados</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {[...draw.numbers].sort((a, b) => a - b).map((num) => (
                      <span key={num} className="bg-[#F4C430] text-[#1F1F1F] font-bold px-3 py-1 rounded-lg text-sm">
                        {num.toString().padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking */}
        {participations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#E5E5E5]">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-[#1F1F1F] mb-2">Nenhum participante ainda</h3>
            <p className="text-[#1F1F1F]/70 mb-6">Ainda não há participações ativas neste concurso.</p>

            {getContestState(contest, draws.length > 0).acceptsParticipations ? (
              <Link
                to={`/contests/${contest.id}/join`}
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#1E7F43] to-[#3CCB7F] text-white rounded-xl font-bold hover:from-[#3CCB7F] hover:to-[#1E7F43] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Participar Agora
              </Link>
            ) : (
              <div className="inline-block px-6 py-3 bg-[#E5E5E5] text-[#1F1F1F]/60 rounded-xl font-bold cursor-not-allowed">
                {getContestState(contest, draws.length > 0).label}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E5E5E5] overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#1E7F43] to-[#3CCB7F]">
              <h2 className="text-2xl font-bold text-white">Classificação</h2>
            </div>

            {/* MODIFIQUEI AQUI - Mensagem quando não há ganhadores premiados (baseado no summary) */}
            {payoutSummary && selectedDrawId &&
              (() => {
                const hasAnyCategory =
                  !!payoutSummary?.categories?.TOP ||
                  !!payoutSummary?.categories?.SECOND ||
                  !!payoutSummary?.categories?.LOWEST

                if (!hasAnyCategory && payoutSummary.maxScore === 0) return null
                if (!hasAnyCategory) {
                  return (
                    <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Nenhum participante foi premiado neste sorteio.</strong> O ranking abaixo mostra a classificação dos participantes.
                      </p>
                    </div>
                  )
                }
                return null
              })()}

            {selectedDrawId && (
              <div className="px-6 py-4 bg-[#F9F9F9] border-b border-[#E5E5E5]">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'all'
                      ? 'bg-[#1E7F43] text-white'
                      : 'bg-white text-[#1F1F1F] hover:bg-[#E5E5E5]'
                      }`}
                  >
                    🔘 Todos
                  </button>
                  <button
                    onClick={() => setFilter('premiados')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'premiados'
                      ? 'bg-[#1E7F43] text-white'
                      : 'bg-white text-[#1F1F1F] hover:bg-[#E5E5E5]'
                      }`}
                  >
                    🏆 Somente Premiados
                  </button>
                  <button
                    onClick={() => setFilter('TOP')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'TOP'
                      ? 'bg-[#1E7F43] text-white'
                      : 'bg-white text-[#1F1F1F] hover:bg-[#E5E5E5]'
                      }`}
                  >
                    🥇 TOP
                  </button>
                  <button
                    onClick={() => setFilter('SECOND')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'SECOND'
                      ? 'bg-[#1E7F43] text-white'
                      : 'bg-white text-[#1F1F1F] hover:bg-[#E5E5E5]'
                      }`}
                  >
                    🥈 SECOND
                  </button>
                  <button
                    onClick={() => setFilter('LOWEST')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'LOWEST'
                      ? 'bg-[#1E7F43] text-white'
                      : 'bg-white text-[#1F1F1F] hover:bg-[#E5E5E5]'
                      }`}
                  >
                    🥉 LOWEST
                  </button>
                  <button
                    onClick={() => setFilter('nao_premiados')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'nao_premiados'
                      ? 'bg-[#1E7F43] text-white'
                      : 'bg-white text-[#1F1F1F] hover:bg-[#E5E5E5]'
                      }`}
                  >
                    ❌ Não premiados
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-[#1F1F1F]">Posição</th>
                    <th className="text-left py-4 px-6 font-semibold text-[#1F1F1F]">Participante</th>
                    <th className="text-left py-4 px-6 font-semibold text-[#1F1F1F]">Números</th>
                    <th className="text-center py-4 px-6 font-semibold text-[#1F1F1F]">Pontuação</th>
                    <th className="text-left py-4 px-6 font-semibold text-[#1F1F1F]">Ticket</th>
                    <th className="text-center py-4 px-6 font-semibold text-[#1F1F1F]">Prêmio</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    console.log('MODIFIQUEI AQUI [RankingPage] render table START - selectedDrawId=', selectedDrawId, 'draws.len=', draws.length)

                    const sortedParticipations = [...participations].sort((a, b) => {
                      const scoreA = selectedDrawId ? getScoreUpToDraw(a, selectedDrawId) : getTotalScore(a)
                      const scoreB = selectedDrawId ? getScoreUpToDraw(b, selectedDrawId) : getTotalScore(b)
                      if (scoreB !== scoreA) return scoreB - scoreA
                      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    })

                    console.log(
                      'MODIFIQUEI AQUI [RankingPage] sortedParticipations preview (top 3)=',
                      sortedParticipations.slice(0, 3).map(p => ({
                        id: p.id,
                        ticket_code: p.ticket_code,
                        created_at: p.created_at,
                        score: selectedDrawId ? getScoreUpToDraw(p, selectedDrawId) : getTotalScore(p),
                      }))
                    )

                    const positionById = new Map<string, number>()
                    sortedParticipations.forEach((p, idx) => positionById.set(p.id, idx + 1))

                    const allScores = sortedParticipations.map(p =>
                      selectedDrawId ? getScoreUpToDraw(p, selectedDrawId) : getTotalScore(p)
                    )

                    const N = Number(contest?.numbers_per_participation || 0)
                    const topScore = Number.isFinite(N) ? N : null
                    const secondScore = Number.isFinite(N) ? (N - 1) : null

                    const positiveScores = allScores.filter(s => s > 0 && s !== topScore && s !== secondScore)
                    const lowestPositiveScore = positiveScores.length > 0 ? Math.min(...positiveScores) : null

                    console.log('MODIFIQUEI AQUI [RankingPage] score thresholds=', {
                      N,
                      topScore,
                      secondScore,
                      lowestPositiveScore,
                      allScoresPreview: allScores.slice(0, 10),
                    })

                    type ScoreCategory = 'TOP' | 'SECOND' | 'LOWEST' | 'NONE'

                    const getCategoryByScore = (score: number): ScoreCategory => {
                      if (topScore !== null && score === topScore) return 'TOP'
                      if (secondScore !== null && score === secondScore) return 'SECOND'
                      if (lowestPositiveScore !== null && score === lowestPositiveScore) return 'LOWEST'
                      return 'NONE'
                    }

                    const getMedalByCategory = (cat: ScoreCategory) => {
                      if (cat === 'TOP') return '🥇'
                      if (cat === 'SECOND') return '🥈'
                      if (cat === 'LOWEST') return '🥉'
                      return undefined
                    }

                    const getPrizeByScoreCategory = (cat: ScoreCategory) => {
                      if (!payoutSummary?.categories) return null
                      if (cat === 'TOP') return payoutSummary.categories.TOP || null
                      if (cat === 'SECOND') return payoutSummary.categories.SECOND || null
                      if (cat === 'LOWEST') return payoutSummary.categories.LOWEST || null
                      return null
                    }

                    // MODIFIQUEI AQUI - winners por SCORE (para dividir corretamente pelo nº de ganhadores)
                    const winnersCountByCategory = () => {
                      const topCount = topScore !== null ? allScores.filter(s => s === topScore).length : 0
                      const secondCount = secondScore !== null ? allScores.filter(s => s === secondScore).length : 0
                      const lowestCount = lowestPositiveScore !== null ? allScores.filter(s => s === lowestPositiveScore).length : 0
                      return { TOP: topCount, SECOND: secondCount, LOWEST: lowestCount }
                    }

                    // MODIFIQUEI AQUI - Prêmio esperado: prioridade % do concurso; fallback summary
                    const getExpectedPrize = (participation: ParticipationWithUser) => {
                      if (!selectedDrawId) return { isWinner: false, category: 'NONE' as ScoreCategory, amount: 0 }

                      const score = selectedDrawId ? getScoreUpToDraw(participation, selectedDrawId) : getTotalScore(participation)
                      const cat = getCategoryByScore(score)
                      if (cat === 'NONE') return { isWinner: false, category: cat, amount: 0 }

                      if (cat === 'LOWEST' && score <= 0) return { isWinner: false, category: 'NONE' as ScoreCategory, amount: 0 }

                      const wc = winnersCountByCategory()
                      const winnersCount =
                        cat === 'TOP' ? wc.TOP : cat === 'SECOND' ? wc.SECOND : wc.LOWEST

                      // MODIFIQUEI AQUI - valor calculado pela % do concurso (fonte principal)
                      const amountFromPercent =
                        winnersCount > 0
                          ? Number(calcAmountPerWinner(cat as 'TOP' | 'SECOND' | 'LOWEST', winnersCount) || 0)
                          : 0

                      // MODIFIQUEI AQUI - fallback: caso backend tenha vindo com amountPerWinner
                      const prize = getPrizeByScoreCategory(cat)
                      const amountFromSummary = Number(prize?.amountPerWinner || 0)

                      const amount = amountFromPercent > 0 ? amountFromPercent : amountFromSummary

                      console.log('MODIFIQUEI AQUI [RankingPage] getExpectedPrize participationId=', participation.id, {
                        selectedDrawId,
                        score,
                        cat,
                        winnersCount,
                        amountFromPercent,
                        amountFromSummary,
                        amountFinal: amount,
                      })

                      return { isWinner: amount > 0, category: cat, amount }
                    }

                    const filteredParticipations = sortedParticipations.filter((participation) => {
                      if (!selectedDrawId) return true

                      const expected = getExpectedPrize(participation)

                      switch (filter) {
                        case 'all':
                          return true
                        case 'premiados':
                          return expected.isWinner
                        case 'TOP':
                          return expected.category === 'TOP'
                        case 'SECOND':
                          return expected.category === 'SECOND'
                        case 'LOWEST':
                          return expected.category === 'LOWEST'
                        case 'nao_premiados':
                          return !expected.isWinner
                        default:
                          return true
                      }
                    })

                    return filteredParticipations.map((participation, index) => {
                      const position = positionById.get(participation.id) || (index + 1)
                      const hitNumbers = getHitNumbersForParticipation(participation)

                      const displayScore = selectedDrawId
                        ? getScoreUpToDraw(participation, selectedDrawId)
                        : getTotalScore(participation)

                      const scoreCategory = selectedDrawId ? getCategoryByScore(displayScore) : 'NONE'
                      const medal = getMedalByCategory(scoreCategory)
                      const hasMedal = medal !== undefined
                      const positionLabel = hasMedal ? medal : `#${position}`

                      const expectedPrize = getExpectedPrize(participation)

                      return (
                        <tr
                          key={participation.id}
                          className={`border-b border-[#E5E5E5] transition-colors hover:bg-[#F9F9F9] ${hasMedal ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' : ''
                            }`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span className={`${hasMedal ? 'text-2xl' : 'text-xl'} font-bold text-[#1F1F1F]/60`}>
                                {positionLabel}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div>
                              <div className="font-semibold text-[#1F1F1F]">{participation.user?.name || 'Usuário Anônimo'}</div>
                              {participation.user?.email && <div className="text-sm text-[#1F1F1F]/60">{participation.user.email}</div>}
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-2">
                              {[...participation.numbers].sort((a, b) => a - b).map((num) => {
                                const isHit = hitNumbers.includes(num)
                                const isDrawn = isNumberDrawn(num)

                                return (
                                  <span
                                    key={num}
                                    className={`font-bold px-3 py-1 rounded-lg text-sm transition-all ${isHit
                                      ? 'bg-[#1E7F43] text-white shadow-lg transform scale-110'
                                      : isDrawn
                                        ? 'bg-[#F4C430] text-[#1F1F1F]'
                                        : 'bg-[#E5E5E5] text-[#1F1F1F]'
                                      }`}
                                    title={isHit ? 'Número acertado!' : isDrawn ? 'Número sorteado' : ''}
                                  >
                                    {num.toString().padStart(2, '0')}
                                    {isHit && ' ✓'}
                                  </span>
                                )
                              })}
                            </div>
                          </td>

                          <td className="py-4 px-6 text-center">
                            <span
                              className={`inline-block px-4 py-2 rounded-lg font-bold text-lg ${displayScore > 0
                                ? 'bg-gradient-to-r from-[#1E7F43] to-[#3CCB7F] text-white'
                                : 'bg-[#E5E5E5] text-[#1F1F1F]'
                                }`}
                            >
                              {displayScore}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span className="text-sm font-mono text-[#1F1F1F]/70">{participation.ticket_code || 'N/A'}</span>
                          </td>

                          {/* MODIFIQUEI AQUI - Prêmio agora mostra o VALOR calculado pela %; senão, “Não premiado” */}
                          <td className="py-4 px-6 text-center">
                            {(() => {
                              if (draws.length === 0) {
                                return <span className="text-sm text-[#1F1F1F]/60">⏳ Aguardando sorteio</span>
                              }
                              if (!selectedDrawId) {
                                return <span className="text-sm text-[#1F1F1F]/40">—</span>
                              }

                              if (expectedPrize.category !== 'NONE') {
                                return (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="px-3 py-1 bg-gradient-to-r from-[#F4C430] to-[#FFD700] text-[#1F1F1F] rounded-lg font-bold text-sm">
                                      🏆 Premiado
                                    </span>
                                    <span className="text-lg font-extrabold text-[#1E7F43]">
                                      R$ {Number(expectedPrize.amount || 0).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                )
                              }

                              return <span className="text-sm text-[#1F1F1F]/60">❌ Não premiado</span>
                            })()}
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>

              </table>
            </div>
          </div>
        )}

        {draws.length === 0 && participations.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Aguardando sorteios</h3>
                <p className="text-sm text-blue-800">
                  O ranking será atualizado automaticamente após a realização dos sorteios. As pontuações são calculadas com base nos números acertados.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
