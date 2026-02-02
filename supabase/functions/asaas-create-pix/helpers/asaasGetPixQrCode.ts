/**
 * Helper: Busca QR Code PIX do Asaas
 * 
 * Função pura que faz fetch para API do Asaas para buscar QR Code de um pagamento.
 * Implementa retry automático com backoff exponencial.
 * Não é uma Edge Function pública, apenas um helper interno.
 */

export interface AsaasPixQrCode {
  encodedImage: string
  payload: string
  expirationDate?: string
}

export interface GetAsaasPixQrCodeResponse {
  qrCode: AsaasPixQrCode
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Busca QR Code PIX do Asaas com retry automático
 * 
 * Implementa 5 tentativas com delays: 0s, 1s, 2s, 4s, 8s (total ~15s)
 * 
 * @param asaasApiKey Chave da API do Asaas
 * @param asaasBaseUrl URL base da API do Asaas
 * @param paymentId ID do pagamento no Asaas
 * @returns QR Code com encodedImage, payload e expirationDate
 * @throws Erro se falhar após todas as tentativas ou se receber erro 4xx
 */
export async function getAsaasPixQrCode(
  asaasApiKey: string,
  asaasBaseUrl: string,
  paymentId: string
): Promise<GetAsaasPixQrCodeResponse> {
  const delays = [0, 1000, 2000, 4000, 8000] // 5 tentativas

  for (let i = 0; i < delays.length; i++) {
    // Aguarda delay antes de tentar (exceto primeira tentativa)
    if (delays[i] > 0) {
      await sleep(delays[i])
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s por tentativa

    try {
      const res = await fetch(`${asaasBaseUrl}/payments/${paymentId}/pixQrCode`, {
        headers: {
          "access_token": asaasApiKey,
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout))

      const text = await res.text()
      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        // JSON inválido
      }

      // Sucesso: QR Code disponível
      if (res.ok && data?.encodedImage && data?.payload) {
        return {
          qrCode: {
            encodedImage: data.encodedImage,
            payload: data.payload,
            expirationDate: data.expirationDate || undefined,
          },
        }
      }

      // Erro 4xx: não tenta mais, retorna erro
      if (!res.ok && res.status >= 400 && res.status < 500) {
        const errorMessage =
          data?.errors?.[0]?.description ||
          data?.message ||
          "Erro ao buscar QR Code do Asaas"
        throw new Error(errorMessage)
      }

      // Erro 5xx ou timeout: continua para próxima tentativa
      // (não lança erro ainda, deixa o loop continuar)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      const isAbort = msg.includes("AbortError") || msg.includes("aborted")

      // Se for abort (timeout) e não for a última tentativa, continua
      if (isAbort && i < delays.length - 1) {
        continue
      }

      // Se for erro 4xx ou última tentativa, lança erro
      if (!isAbort || i === delays.length - 1) {
        throw error
      }
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  throw new Error("QR Code ainda não disponível após múltiplas tentativas")
}
