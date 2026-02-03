/**
 * Página de participação em concurso
 * FASE 2: Participações e Ranking
 * 
 * Permite que usuários escolham números e participem de um concurso
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getContestById } from '../services/contestsService'
import { listDrawsByContestId } from '../services/drawsService'
import { Contest, Draw } from '../types'
import NumberPicker from '../components/NumberPicker'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { canAcceptParticipations, getContestState } from '../utils/contestHelpers'
import ContestStatusBadge from '../components/ContestStatusBadge'

export default function JoinContestPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { addItem, getItemCount } = useCart()
  const [contest, setContest] = useState<Contest | null>(null)
  const [draws, setDraws] = useState<Draw[]>([])
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    // MODIFIQUEI AQUI - Redirecionar para login se não autenticado
    if (!authLoading && !user) {
      navigate('/login')
      return
    }

    async function loadContest() {
      if (!id) {
        setError('ID do concurso não fornecido')
        setLoading(false)
        return
      }

      // MODIFIQUEI AQUI - Aguardar autenticação antes de carregar concurso
      if (authLoading || !user) {
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // MODIFIQUEI AQUI - Carregar concurso e sorteios em paralelo para verificar se há sorteios
        const [contestData, drawsData] = await Promise.all([
          getContestById(id),
          listDrawsByContestId(id || ''),
        ])

        if (!contestData) {
          setError('Concurso não encontrado')
          return
        }

        // MODIFIQUEI AQUI - Verificar se o concurso ainda aceita participações usando helper
        const hasDraws = drawsData.length > 0
        if (!canAcceptParticipations(contestData, hasDraws)) {
          const state = getContestState(contestData, hasDraws)
          setError(state.message)
          return
        }

        setContest(contestData)
        setDraws(drawsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar concurso')
      } finally {
        setLoading(false)
      }
    }

    loadContest()
  }, [id, user, authLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contest || !id) return

    // Validação no frontend
    if (selectedNumbers.length !== contest.numbers_per_participation) {
      setError(
        `Você deve selecionar exatamente ${contest.numbers_per_participation} números`
      )
      return
    }

    // Validar intervalo
    const invalidNumbers = selectedNumbers.filter(
      (n) => n < contest.min_number || n > contest.max_number
    )
    if (invalidNumbers.length > 0) {
      setError(
        `Números fora do intervalo permitido (${contest.min_number} - ${contest.max_number})`
      )
      return
    }

    // MODIFIQUEI AQUI - Salvar números no sessionStorage para persistência em caso de reload
    sessionStorage.setItem('dezaqui_checkout', JSON.stringify({
      contestId: id,
      selectedNumbers,
      timestamp: Date.now(),
    }))

    // Redirecionar para pagina de checkout ao inves de criar participacao diretamente
    navigate(`/contests/${id}/checkout`, {
      state: { selectedNumbers },
    })
  }

  // Funcao para adicionar ao carrinho
  const handleAddToCart = () => {
    if (!contest || selectedNumbers.length !== contest.numbers_per_participation) return

    // Validar intervalo
    const invalidNumbers = selectedNumbers.filter(
      (n) => n < contest.min_number || n > contest.max_number
    )
    if (invalidNumbers.length > 0) {
      setError(
        `Numeros fora do intervalo permitido (${contest.min_number} - ${contest.max_number})`
      )
      return
    }

    // Adicionar ao carrinho
    addItem(contest, selectedNumbers)
    setAddedToCart(true)

    // Limpar selecao para permitir adicionar mais
    setSelectedNumbers([])

    // Resetar feedback apos alguns segundos
    setTimeout(() => {
      setAddedToCart(false)
    }, 3000)
  }

  // MODIFIQUEI AQUI - Mostrar loading apenas enquanto carrega o concurso ou autenticação
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E7F43] mx-auto"></div>
            <p className="mt-4 text-[#1F1F1F]/70">
              {authLoading ? 'Verificando autenticação...' : 'Carregando concurso...'}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error && !contest) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
        <Header />
        <div className="flex items-center justify-center flex-1 px-4">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2">⚠️ Erro</div>
            <p className="text-[#1F1F1F]/70 mb-4">{error}</p>
            <Link
              to="/contests"
              className="text-[#1E7F43] hover:text-[#3CCB7F] underline font-semibold"
            >
              Voltar para lista de concursos
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
        <Header />
        <div className="flex items-center justify-center flex-1 px-4">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2">⚠️ Autenticação necessária</div>
            <p className="text-[#1F1F1F]/70 mb-4">
              Você precisa estar logado para participar de concursos
            </p>
            <Link
              to="/contests"
              className="text-[#1E7F43] hover:text-[#3CCB7F] underline font-semibold"
            >
              Voltar para lista de concursos
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!contest) return null

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8 flex-1 max-w-4xl">
        <Link
          to={`/contests/${id}`}
          className="text-[#1E7F43] hover:text-[#3CCB7F] mb-4 inline-block font-semibold transition-colors text-sm sm:text-base"
        >
          <span className="hidden sm:inline">← Voltar para o concurso</span>
          <span className="sm:hidden">← Voltar</span>
        </Link>

        <div className="rounded-2xl sm:rounded-3xl border border-[#E5E5E5] bg-white p-4 sm:p-6 mb-6 shadow-xl">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1F1F1F] mb-2">
            Participar: {contest.name}
          </h1>
          {/* MODIFIQUEI AQUI - Exibir código do concurso */}
          {contest.contest_code && (
            <div className="mb-3">
              <span className="px-3 py-1 bg-[#1E7F43] text-white rounded-full text-xs sm:text-sm font-mono font-semibold">
                Código do Concurso: {contest.contest_code}
              </span>
            </div>
          )}
          {contest.description && (
            <p className="text-[#1F1F1F]/70 mb-4">{contest.description}</p>
          )}

          <div className="rounded-2xl border border-[#E5E5E5] bg-[#F9F9F9] p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-[#1F1F1F]/60">Intervalo numérico:</span>
                <span className="ml-2 font-semibold">
                  <span className="px-2 py-1 bg-[#F4C430] text-[#1F1F1F] rounded font-bold">{contest.min_number}</span>
                  {' - '}
                  <span className="px-2 py-1 bg-[#F4C430] text-[#1F1F1F] rounded font-bold">{contest.max_number}</span>
                </span>
              </div>
              <div>
                <span className="text-[#1F1F1F]/60">Números por participação:</span>
                <span className="ml-2 px-2 py-1 bg-[#F4C430] text-[#1F1F1F] rounded font-bold">
                  {contest.numbers_per_participation}
                </span>
              </div>
              <div>
                <span className="text-[#1F1F1F]/60">Status:</span>
                <span className="ml-2">
                  <ContestStatusBadge 
                    contest={contest} 
                    hasDraws={draws.length > 0}
                    variant="compact"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl sm:rounded-3xl border border-[#E5E5E5] bg-white p-4 sm:p-6 shadow-xl">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F1F1F] mb-4">
            Escolha seus números
          </h2>

          <NumberPicker
            min={contest.min_number}
            max={contest.max_number}
            maxSelected={contest.numbers_per_participation}
            selectedNumbers={selectedNumbers}
            onChange={setSelectedNumbers}
          />

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Feedback de item adicionado ao carrinho */}
          {addedToCart && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-green-700 text-sm font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Aposta adicionada ao carrinho!
                </p>
                <Link
                  to="/cart"
                  className="text-green-700 font-semibold hover:underline text-sm"
                >
                  Ver Carrinho ({getItemCount()})
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Botao Adicionar ao Carrinho */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={selectedNumbers.length !== contest.numbers_per_participation}
              className={`
                w-full sm:flex-1 py-3 px-6 rounded-xl font-semibold transition-colors shadow-lg text-sm sm:text-base flex items-center justify-center gap-2
                ${
                  selectedNumbers.length !== contest.numbers_per_participation
                    ? 'bg-[#E5E5E5] text-[#1F1F1F]/60 cursor-not-allowed'
                    : 'bg-[#F4C430] text-[#1F1F1F] hover:bg-[#F4C430]/80'
                }
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Adicionar ao Carrinho
            </button>

            {/* Botao Comprar Agora */}
            <button
              type="submit"
              disabled={selectedNumbers.length !== contest.numbers_per_participation}
              className={`
                w-full sm:flex-1 py-3 px-6 rounded-xl font-semibold transition-colors shadow-lg text-sm sm:text-base
                ${
                  selectedNumbers.length !== contest.numbers_per_participation
                    ? 'bg-[#E5E5E5] text-[#1F1F1F]/60 cursor-not-allowed'
                    : 'bg-[#1E7F43] text-white hover:bg-[#3CCB7F]'
                }
              `}
            >
              Comprar Agora
            </button>
          </div>

          {/* Link para carrinho se tiver itens */}
          {getItemCount() > 0 && (
            <div className="mt-4 text-center">
              <Link
                to="/cart"
                className="text-[#1E7F43] font-semibold hover:underline inline-flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Ver Carrinho ({getItemCount()} {getItemCount() === 1 ? 'item' : 'itens'})
              </Link>
            </div>
          )}
        </form>
      </div>
      <Footer />
    </div>
  )
}
