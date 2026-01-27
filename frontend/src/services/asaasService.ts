/**
 * Serviço de integração com API Asaas
 * FASE 3: Pagamentos e Ativação
 * 
 * Funções para gerar QR Code Pix e gerenciar pagamentos via Asaas
 */

export interface AsaasPixQRCodeResponse {
  encodedImage: string // Base64 da imagem do QR Code
  payload: string // Código Pix copia e cola
  expirationDate: string // Data de expiração do QR Code
}

export interface CreatePixPaymentParams {
  participationId: string
  ticketCode: string
  amount: number
  description: string
  customerName: string
  customerCpfCnpj?: string
  customerEmail?: string
  customerPhone?: string
}

export interface CreatePixPaymentResponse {
  id: string // ID do pagamento no Asaas
  qrCode: AsaasPixQRCodeResponse
  status: string
  dueDate: string
}

/**
 * Cria um pagamento Pix via API Asaas e retorna o QR Code
 * MODIFIQUEI AQUI - Função para criar pagamento Pix e gerar QR Code
 * 
 * @param params Parâmetros do pagamento Pix
 * @returns Dados do pagamento incluindo QR Code
 */
export async function createPixPayment(params: CreatePixPaymentParams): Promise<CreatePixPaymentResponse> {
  // MODIFIQUEI AQUI - Obter credenciais do Asaas das variáveis de ambiente
  const asaasApiKey = import.meta.env.VITE_ASAAS_API_KEY
  const asaasBaseUrl = import.meta.env.VITE_ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3'

  if (!asaasApiKey) {
    throw new Error('Configuração do Asaas não encontrada. Verifique as variáveis de ambiente.')
  }

  // MODIFIQUEI AQUI - Criar cliente no Asaas (se necessário) ou usar cliente existente
  // Por enquanto, vamos criar o pagamento diretamente
  // Em produção, você pode querer criar/atualizar o cliente primeiro

  const paymentData = {
    customer: params.customerCpfCnpj || undefined, // CPF/CNPJ do cliente (opcional)
    billingType: 'PIX',
    value: params.amount,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vencimento em 24h
    description: params.description,
    externalReference: params.ticketCode, // Usar ticket code como referência externa
    // Campos opcionais do cliente
    ...(params.customerName && { name: params.customerName }),
    ...(params.customerEmail && { email: params.customerEmail }),
    ...(params.customerPhone && { phone: params.customerPhone }),
  }

  try {
    // MODIFIQUEI AQUI - Criar pagamento no Asaas
    const createResponse = await fetch(`${asaasBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(paymentData),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}))
      throw new Error(
        errorData.errors?.[0]?.description || 
        `Erro ao criar pagamento no Asaas: ${createResponse.statusText}`
      )
    }

    const payment = await createResponse.json()

    // MODIFIQUEI AQUI - Buscar QR Code do pagamento criado
    const qrCodeResponse = await fetch(`${asaasBaseUrl}/payments/${payment.id}/pixQrCode`, {
      method: 'GET',
      headers: {
        'access_token': asaasApiKey,
      },
    })

    if (!qrCodeResponse.ok) {
      throw new Error('Erro ao gerar QR Code Pix')
    }

    const qrCodeData = await qrCodeResponse.json()

    return {
      id: payment.id,
      qrCode: {
        encodedImage: qrCodeData.encodedImage || '',
        payload: qrCodeData.payload || '',
        expirationDate: qrCodeData.expirationDate || payment.dueDate,
      },
      status: payment.status,
      dueDate: payment.dueDate,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Erro desconhecido ao criar pagamento Pix')
  }
}

/**
 * Verifica o status de um pagamento no Asaas
 * MODIFIQUEI AQUI - Função para verificar status do pagamento
 * 
 * @param paymentId ID do pagamento no Asaas
 * @returns Status do pagamento
 */
export async function checkPaymentStatus(paymentId: string): Promise<{
  status: string
  paid: boolean
  paidDate?: string
}> {
  const asaasApiKey = import.meta.env.VITE_ASAAS_API_KEY
  const asaasBaseUrl = import.meta.env.VITE_ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3'

  if (!asaasApiKey) {
    throw new Error('Configuração do Asaas não encontrada')
  }

  try {
    const response = await fetch(`${asaasBaseUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'access_token': asaasApiKey,
      },
    })

    if (!response.ok) {
      throw new Error('Erro ao verificar status do pagamento')
    }

    const payment = await response.json()

    return {
      status: payment.status,
      paid: payment.status === 'CONFIRMED' || payment.status === 'RECEIVED',
      paidDate: payment.paymentDate || undefined,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Erro desconhecido ao verificar status do pagamento')
  }
}
