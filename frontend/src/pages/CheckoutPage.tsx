/**
 * Página de Checkout
 * FASE 3: Pagamentos e Ativação
 * 
 * Exibe informações da participação e opções de pagamento (Pix ou Dinheiro)
 */
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { getContestById } from '../services/contestsService'
import { createParticipation } from '../services/participationsService'
import { createPixPaymentRecord } from '../services/paymentsService'
import { createPixPayment } from '../services/asaasService'
import { Contest, Participation } from '../types'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import Footer from '../components/Footer'

interface LocationState {
  selectedNumbers: number[]
}

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, loading: authLoading } = useAuth()
  const [contest, setContest] = useState<Contest | null>(null)
  const [participation, setParticipation] = useState<Participation | null>(null)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cash' | null>(null)
  const [pixQrCode, setPixQrCode] = useState<string>('')
  const [pixPayload, setPixPayload] = useState<string>('')
  const [pixExpirationDate, setPixExpirationDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const participationCreatedRef = useRef(false) // MODIFIQUEI AQUI - Flag para evitar criação duplicada

  useEffect(() => {
    // MODIFIQUEI AQUI - Verificar se há números selecionados
    const state = location.state as LocationState
    if (!state?.selectedNumbers || state.selectedNumbers.length === 0) {
      // Se não há números, redirecionar para página de seleção
      if (id) {
        navigate(`/contests/${id}/join`)
      } else {
        navigate('/contests')
      }
      return
    }

    setSelectedNumbers(state.selectedNumbers)

    async function loadData() {
      if (!id || !user || participationCreatedRef.current) return // MODIFIQUEI AQUI - Evitar criação duplicada

      try {
        setLoading(true)
        setError(null)

        // Carregar concurso
        const contestData = await getContestById(id)
        if (!contestData) {
          setError('Concurso não encontrado')
          return
        }

        if (contestData.status !== 'active') {
          setError('Este concurso não está ativo para participação')
          return
        }

        setContest(contestData)

        // MODIFIQUEI AQUI - Criar participação automaticamente ao entrar no checkout (apenas uma vez)
        if (!participationCreatedRef.current) {
          participationCreatedRef.current = true
          const participationData = await createParticipation({
            contestId: id,
            numbers: state.selectedNumbers,
          })

          setParticipation(participationData)
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        participationCreatedRef.current = false // MODIFIQUEI AQUI - Resetar flag em caso de erro
        setError(err instanceof Error ? err.message : 'Erro ao processar participação')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      loadData()
    }
  }, [id, user, authLoading, navigate, location.state])

  const handlePaymentMethodSelect = (method: 'pix' | 'cash') => {
    setPaymentMethod(method)
    setError(null)
  }

  const handleCashPayment = async () => {
    if (!participation || !contest) return

    // MODIFIQUEI AQUI - Pagamento em dinheiro não cria pagamento automaticamente
    // Apenas confirma que a participação foi criada e ficará pendente até o admin ativar
    setSuccess(true)
    
    // Redirecionar após 3 segundos
    // setTimeout(() => {
    //   navigate(`/contests/${id}`)
    // }, 3000)
  }

  const handlePixPayment = async () => {
    if (!participation || !contest || !profile) return

    try {
      setProcessing(true)
      setError(null)

      // MODIFIQUEI AQUI - Criar pagamento Pix e gerar QR Code
      const pixData = await createPixPayment({
        participationId: participation.id,
        ticketCode: participation.ticket_code || '',
        amount: contest.participation_value || 0,
        description: `Participação no concurso ${contest.name} - Ticket: ${participation.ticket_code}`,
        customerName: profile.name || 'Cliente',
        customerEmail: profile.email || undefined,
        customerPhone: profile.phone || undefined,
      })

      setPixQrCode(pixData.qrCode.encodedImage)
      setPixPayload(pixData.qrCode.payload)
      setPixExpirationDate(pixData.qrCode.expirationDate)

      // MODIFIQUEI AQUI - Salvar registro do pagamento Pix no banco
      await createPixPaymentRecord({
        participationId: participation.id,
        amount: contest.participation_value || 0,
        externalId: pixData.id,
        qrCodeData: {
          payload: pixData.qrCode.payload,
          expirationDate: pixData.qrCode.expirationDate,
        },
      })

      setSuccess(true)
    } catch (err) {
      console.error('Erro ao processar pagamento Pix:', err)
      setError(err instanceof Error ? err.message : 'Erro ao gerar QR Code Pix')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
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

  const copyPixPayload = () => {
    if (pixPayload) {
      navigator.clipboard.writeText(pixPayload)
      // Mostrar feedback visual
      const btn = document.getElementById('copy-pix-btn')
      if (btn) {
        const originalText = btn.textContent
        btn.textContent = 'Copiado!'
        setTimeout(() => {
          btn.textContent = originalText
        }, 2000)
      }
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E7F43] mx-auto"></div>
            <p className="mt-4 text-[#1F1F1F]/70">
              {authLoading ? 'Verificando autenticação...' : 'Processando participação...'}
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

  if (!user || !contest || !participation) {
    return null
  }

  const participationValue = contest.participation_value || 0

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Cabeçalho */}
        <div className="mb-6">
          <Link
            to={`/contests/${id}/join`}
            className="text-[#1E7F43] hover:text-[#3CCB7F] font-semibold flex items-center gap-2 mb-4 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para seleção de números
          </Link>
          
          <h1 className="text-3xl font-extrabold text-[#1F1F1F] mb-2">
            Finalizar Participação
          </h1>
          <p className="text-[#1F1F1F]/70">
            Revise as informações e escolha a forma de pagamento
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && paymentMethod === 'cash' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-800 text-sm font-semibold mb-2">
              ✓ Participação criada com sucesso!
            </p>
            <p className="text-blue-700 text-sm">
              Sua participação ficará <strong>pendente</strong> até que um administrador registre o pagamento em dinheiro e ative sua participação. 
              Você pode acompanhar o status em "Meus Tickets".
            </p>
          </div>
        )}

        {/* Informações da Participação */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-[#E5E5E5]">
          <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">Informações da Participação</h2>
          
          <div className="space-y-4">
            {/* Concurso */}
            <div>
              <span className="text-sm text-[#1F1F1F]/60">Concurso:</span>
              <p className="font-semibold text-[#1F1F1F]">{contest.name}</p>
            </div>

            {/* Números Selecionados */}
            <div>
              <span className="text-sm text-[#1F1F1F]/60">Números Selecionados:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedNumbers.sort((a, b) => a - b).map((num) => (
                  <span
                    key={num}
                    className="px-3 py-1 bg-[#1E7F43] text-white rounded-lg font-bold text-sm"
                  >
                    {num.toString().padStart(2, '0')}
                  </span>
                ))}
              </div>
            </div>

            {/* Código do Ticket */}
            {participation.ticket_code && (
              <div>
                <span className="text-sm text-[#1F1F1F]/60">Código do Ticket:</span>
                <p className="font-mono font-semibold text-[#1F1F1F] text-lg">
                  {participation.ticket_code}
                </p>
              </div>
            )}

            {/* Data e Hora */}
            <div>
              <span className="text-sm text-[#1F1F1F]/60">Data e Hora:</span>
              <p className="font-semibold text-[#1F1F1F]">
                {formatDateTime(participation.created_at)}
              </p>
            </div>

            {/* Valor */}
            <div className="pt-4 border-t border-[#E5E5E5]">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-[#1F1F1F]">Valor Total:</span>
                <span className="text-2xl font-extrabold text-[#1E7F43]">
                  {formatCurrency(participationValue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Seleção de Método de Pagamento */}
        {!success && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-[#E5E5E5]">
            <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">Escolha a Forma de Pagamento</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opção Pix */}
              <button
                onClick={() => handlePaymentMethodSelect('pix')}
                disabled={processing}
                className={`p-6 rounded-xl border-2 transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-[#1E7F43] bg-[#1E7F43]/5'
                    : 'border-[#E5E5E5] hover:border-[#1E7F43] bg-white'
                } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">💳</div>
                  <h3 className="text-lg font-bold text-[#1F1F1F] mb-1">Pix</h3>
                  <p className="text-sm text-[#1F1F1F]/60">
                    Pagamento instantâneo e ativação automática
                  </p>
                </div>
              </button>

              {/* Opção Dinheiro */}
              <button
                onClick={() => handlePaymentMethodSelect('cash')}
                disabled={processing}
                className={`p-6 rounded-xl border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-[#1E7F43] bg-[#1E7F43]/5'
                    : 'border-[#E5E5E5] hover:border-[#1E7F43] bg-white'
                } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">💵</div>
                  <h3 className="text-lg font-bold text-[#1F1F1F] mb-1">Dinheiro</h3>
                  <p className="text-sm text-[#1F1F1F]/60">
                    Pagamento presencial - ativação manual pelo administrador
                  </p>
                </div>
              </button>
            </div>

            {/* Botão de Confirmação */}
            {paymentMethod && (
              <div className="mt-6 pt-6 border-t border-[#E5E5E5]">
                <button
                  onClick={() => {
                    if (paymentMethod === 'pix') {
                      handlePixPayment()
                    } else {
                      handleCashPayment()
                    }
                  }}
                  disabled={processing}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors ${
                    processing
                      ? 'bg-[#E5E5E5] text-[#1F1F1F]/60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#1E7F43] to-[#3CCB7F] text-white hover:from-[#3CCB7F] hover:to-[#1E7F43]'
                  }`}
                >
                  {processing
                    ? 'Processando...'
                    : paymentMethod === 'pix'
                    ? 'Gerar QR Code Pix'
                    : 'Confirmar Participação'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mensagem de sucesso para pagamento em dinheiro */}
        {success && paymentMethod === 'cash' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E5E5]">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-2">
                Participação Criada com Sucesso!
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
                <p className="text-blue-800 text-sm mb-2">
                  <strong>Código do Ticket:</strong>
                </p>
                <p className="font-mono font-bold text-lg text-blue-900 mb-3">
                  {participation.ticket_code}
                </p>
                <p className="text-blue-700 text-sm">
                  Sua participação está <strong>pendente</strong>. Um administrador registrará o pagamento em dinheiro e ativará sua participação.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Link
                  to={`/contests/${id}`}
                  className="px-6 py-3 bg-[#1E7F43] text-white rounded-xl font-semibold hover:bg-[#3CCB7F] transition-colors"
                >
                  Voltar para o Concurso
                </Link>
                <Link
                  to="/my-tickets"
                  className="px-6 py-3 bg-white border-2 border-[#1E7F43] text-[#1E7F43] rounded-xl font-semibold hover:bg-[#1E7F43]/5 transition-colors"
                >
                  Ver Meus Tickets
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Pix */}
        {success && paymentMethod === 'pix' && pixQrCode && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E5E5]">
            <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">Pagamento via Pix</h2>
            
            <div className="text-center space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${pixQrCode}`}
                  alt="QR Code Pix"
                  className="border-2 border-[#E5E5E5] rounded-xl p-4 bg-white"
                />
              </div>

              {/* Código Pix Copia e Cola */}
              <div>
                <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                  Código Pix (Copia e Cola):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixPayload}
                    className="flex-1 px-4 py-2 border border-[#E5E5E5] rounded-lg font-mono text-sm bg-[#F9F9F9]"
                  />
                  <button
                    id="copy-pix-btn"
                    onClick={copyPixPayload}
                    className="px-6 py-2 bg-[#1E7F43] text-white rounded-lg font-semibold hover:bg-[#3CCB7F] transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* Informações */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Valor:</strong> {formatCurrency(participationValue)}
                </p>
                {pixExpirationDate && (
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>Válido até:</strong> {formatDateTime(pixExpirationDate)}
                  </p>
                )}
                <p className="text-sm text-blue-800 mt-2">
                  Após o pagamento, sua participação será ativada automaticamente.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Link
                  to={`/contests/${id}`}
                  className="px-6 py-3 bg-[#1E7F43] text-white rounded-xl font-semibold hover:bg-[#3CCB7F] transition-colors"
                >
                  Voltar para o Concurso
                </Link>
                <Link
                  to="/my-tickets"
                  className="px-6 py-3 bg-white border-2 border-[#1E7F43] text-[#1E7F43] rounded-xl font-semibold hover:bg-[#1E7F43]/5 transition-colors"
                >
                  Ver Meus Tickets
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
