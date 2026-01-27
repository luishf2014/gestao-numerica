/**
 * Utilitários para exportação de dados
 * FASE 4: Sorteios e Rateio
 * 
 * Funções para exportar relatórios em diferentes formatos
 */
import { ReportData } from '../services/reportsService'

/**
 * Exporta relatório para CSV
 * MODIFIQUEI AQUI - Função para exportar CSV
 */
export function exportToCSV(reportData: ReportData): void {
  const rows: string[] = []
  
  // Cabeçalho
  rows.push('Nome,Email,Código/Ticket,Números,Pontuação,Valor Pago,Status')
  
  // Dados
  reportData.participations.forEach(p => {
    const numbers = p.numbers.map(n => n.toString().padStart(2, '0')).join(';')
    const value = p.payment ? p.payment.amount.toFixed(2) : '0.00'
    rows.push(
      `"${p.user?.name || 'N/A'}","${p.user?.email || 'N/A'}","${p.ticket_code || 'N/A'}","${numbers}",${p.current_score},${value},"${p.status}"`
    )
  })
  
  // Criar arquivo
  const csvContent = rows.join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `relatorio_${reportData.contest.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Exporta relatório para Excel (formato CSV com extensão .xlsx)
 * MODIFIQUEI AQUI - Função para exportar Excel (usando CSV por enquanto)
 */
export function exportToExcel(reportData: ReportData): void {
  // Por enquanto, usamos CSV com extensão .xlsx
  // Para implementação completa, seria necessário biblioteca como xlsx
  exportToCSV(reportData)
}

/**
 * Gera conteúdo HTML para PDF
 * MODIFIQUEI AQUI - Função refatorada para gerar HTML do relatório com novo design
 */
export function generateReportHTML(reportData: ReportData, rateioData?: any): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // MODIFIQUEI AQUI - Coletar todos os números sorteados de todos os sorteios
  const allDrawnNumbers: number[] = []
  reportData.draws.forEach(draw => {
    allDrawnNumbers.push(...draw.numbers)
  })
  const uniqueDrawnNumbers = Array.from(new Set(allDrawnNumbers)).sort((a, b) => a - b)

  // MODIFIQUEI AQUI - Função para verificar se um número foi acertado
  const isHit = (number: number): boolean => {
    return uniqueDrawnNumbers.includes(number)
  }

  // MODIFIQUEI AQUI - Calcular acertos para uma participação
  const getHits = (numbers: number[]): number => {
    return numbers.filter(n => isHit(n)).length
  }

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório - ${reportData.contest.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: 30px 40px; 
          color: #1F1F1F; 
          line-height: 1.6;
          background: #ffffff;
        }
        
        /* Cabeçalho */
        .header { 
          text-align: center; 
          margin-bottom: 35px; 
          padding-bottom: 25px;
          border-bottom: 4px solid #1E7F43;
        }
        .header h1 { 
          color: #1E7F43; 
          font-size: 28px; 
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .header .subtitle {
          color: #666;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .header .date {
          color: #888;
          font-size: 12px;
        }
        
        /* Aviso de pagamento */
        .warning-box {
          background: #FFF3CD;
          border: 2px solid #FFC107;
          border-radius: 8px;
          padding: 15px 20px;
          margin-bottom: 30px;
          text-align: center;
        }
        .warning-box p {
          color: #856404;
          font-weight: 600;
          font-size: 13px;
          margin: 0;
        }
        
        /* Seção de Resultados */
        .results-section {
          background: #F8F9FA;
          border: 2px solid #1E7F43;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 35px;
        }
        .results-section h2 {
          color: #1E7F43;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .results-numbers {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .result-number {
          background: #1E7F43;
          color: white;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          min-width: 45px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .no-results {
          color: #666;
          font-style: italic;
          font-size: 14px;
        }
        
        /* Tabela de Participações */
        .table-section {
          margin-bottom: 35px;
        }
        .table-section h2 {
          color: #1E7F43;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 18px;
          padding-bottom: 10px;
          border-bottom: 2px solid #E5E5E5;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        th { 
          background: #1E7F43; 
          color: white; 
          padding: 14px 12px; 
          text-align: left; 
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        th:first-child { border-top-left-radius: 8px; }
        th:last-child { border-top-right-radius: 8px; }
        td { 
          padding: 12px; 
          border-bottom: 1px solid #E5E5E5; 
          font-size: 11px;
          vertical-align: middle;
        }
        tr:last-child td:first-child { border-bottom-left-radius: 8px; }
        tr:last-child td:last-child { border-bottom-right-radius: 8px; }
        tr:hover { background: #F9F9F9; }
        
        /* Números em linha única */
        .numbers-inline {
          display: inline-block;
          white-space: nowrap;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          line-height: 1.8;
        }
        .number-item {
          display: inline-block;
          margin-right: 6px;
          padding: 2px 6px;
          background: #F4C430;
          color: #1F1F1F;
          border-radius: 4px;
          font-weight: 600;
          font-size: 10px;
        }
        .number-item.hit {
          background: #1E7F43;
          color: white;
          font-weight: 700;
          border: 2px solid #0F5F2F;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.3);
        }
        .hits-count {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 8px;
          background: #E8F5E9;
          color: #1E7F43;
          border-radius: 4px;
          font-weight: 600;
          font-size: 10px;
        }
        
        /* Seção de Prêmios */
        .prizes-section {
          background: #F8F9FA;
          border-radius: 10px;
          padding: 25px;
          margin-bottom: 30px;
          border: 2px solid #1E7F43;
        }
        .prizes-section h2 {
          color: #1E7F43;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 20px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .prize-category {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          border-left: 5px solid #1E7F43;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .prize-category h3 {
          color: #1E7F43;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .category-summary {
          color: #1F1F1F;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #E5E5E5;
        }
        .winners-list {
          margin-top: 10px;
        }
        .winner-item {
          padding: 10px 0;
          border-bottom: 1px solid #F0F0F0;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .winner-item:last-child {
          border-bottom: none;
        }
        .winner-ticket {
          color: #1E7F43;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          font-weight: 600;
          min-width: 120px;
        }
        .winner-separator {
          color: #999;
          font-weight: 300;
        }
        .winner-name {
          color: #1F1F1F;
          font-size: 12px;
          flex: 1;
        }
        
        /* Final do Bolão */
        .final-banner {
          background: linear-gradient(135deg, #1E7F43 0%, #3CCB7F 100%);
          color: white;
          text-align: center;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
          box-shadow: 0 4px 12px rgba(30,127,67,0.3);
        }
        .final-banner h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        @media print { 
          .no-print { display: none; }
          body { padding: 20px; }
          .results-section, .prizes-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <!-- Cabeçalho -->
      <div class="header">
        <h1>${reportData.contest.name}</h1>
        <div class="subtitle">Data de Início: ${formatDate(reportData.contest.start_date)}</div>
        <div class="date">Relatório gerado em: ${formatDateTime(new Date().toISOString())}</div>
      </div>

      <!-- Aviso Fixo -->
      <div class="warning-box">
        <p>⚠️ Atenção - O jogo que não estiver pago não terá direito de receber os prêmios.</p>
      </div>

      <!-- MODIFIQUEI AQUI - Resultados no TOPO -->
      <div class="results-section">
        <h2>Resultados / Números Sorteados</h2>
        <div class="results-numbers">
          ${uniqueDrawnNumbers.length > 0 
            ? uniqueDrawnNumbers.map(n => `<span class="result-number">${n.toString().padStart(2, '0')}</span>`).join('')
            : '<span class="no-results">Resultados: -</span>'
          }
        </div>
      </div>

      <!-- Tabela de Participações -->
      <div class="table-section">
        <h2>Lista de Participações</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">ID</th>
              <th style="width: 200px;">Nome</th>
              <th style="width: 180px;">Código/Ticket</th>
              <th>Números Escolhidos</th>
            </tr>
          </thead>
          <tbody>
  `

  // MODIFIQUEI AQUI - Gerar linhas da tabela com ID sequencial
  reportData.participations.forEach((p, index) => {
    const sequentialId = index + 1
    const hits = getHits(p.numbers)
    const numbersHtml = p.numbers.map(n => {
      const isHitNumber = isHit(n)
      return `<span class="number-item ${isHitNumber ? 'hit' : ''}">${n.toString().padStart(2, '0')}</span>`
    }).join('')
    
    html += `
            <tr>
              <td style="text-align: center; font-weight: 600; color: #666;">${sequentialId}</td>
              <td style="font-weight: 500;">${p.user?.name || 'N/A'}</td>
              <td style="font-family: 'Courier New', monospace; font-size: 10px; color: #666;">${p.ticket_code || 'N/A'}</td>
              <td>
                <div class="numbers-inline">
                  ${numbersHtml}
                  ${hits > 0 ? `<span class="hits-count">Acertos: ${hits}</span>` : ''}
                </div>
              </td>
            </tr>
    `
  })

  html += `
          </tbody>
        </table>
      </div>
  `

  // MODIFIQUEI AQUI - Bloco "Resumo Final do Bolão" (OBRIGATÓRIO NO RELATÓRIO FINAL)
  // Verificar se é relatório final e se há rateio disponível
  const isFinalReport = reportData.reportType === 'final' || reportData.contest.status === 'finished'
  const hasRateio = rateioData && rateioData.distribuicao && Array.isArray(rateioData.distribuicao) && rateioData.distribuicao.length > 0
  
  if (isFinalReport && hasRateio) {
    html += `
      <!-- Banner FIM DO BOLÃO -->
      <div class="final-banner">
        <h2>FIM DO BOLÃO</h2>
      </div>
      
      <!-- Resumo Final do Bolão -->
      <div class="prizes-section">
        <h2>Resumo Final do Bolão</h2>
    `

    // MODIFIQUEI AQUI - Agrupar ganhadores por categoria e ordenar por pontuação (maior para menor)
    const distribuicoesOrdenadas = [...rateioData.distribuicao].sort((a: any, b: any) => b.pontuacao - a.pontuacao)
    
    distribuicoesOrdenadas.forEach((distribuicao: any) => {
      // Buscar ganhadores desta categoria
      const ganhadoresCategoria = rateioData.ganhadores.filter((g: any) => g.categoria === distribuicao.categoria)
      
      // MODIFIQUEI AQUI - Determinar texto da categoria conforme exemplo fornecido
      let categoriaTexto = ''
      if (distribuicao.categoria === 'Maior Pontuação') {
        categoriaTexto = `${distribuicao.pontuacao} Pontos`
      } else if (distribuicao.categoria === 'Segunda Maior Pontuação') {
        categoriaTexto = `${distribuicao.pontuacao} Pontos`
      } else if (distribuicao.categoria === 'Menor Pontuação') {
        categoriaTexto = `Menos Pontos`
      } else {
        categoriaTexto = `${distribuicao.pontuacao} Pontos`
      }
      
      // MODIFIQUEI AQUI - Formatar valor com separador de milhar (formato brasileiro)
      const valorFormatado = distribuicao.valorPorGanhador.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      
      // MODIFIQUEI AQUI - Determinar se é a menor pontuação para usar texto específico
      const isMenorPontuacao = distribuicao.categoria === 'Menor Pontuação'
      const textoResumo = isMenorPontuacao
        ? `${categoriaTexto} - ${distribuicao.quantidadeGanhadores} ganhadores - Valor para cada premiado que acertou ${distribuicao.pontuacao} ponto: R$${valorFormatado}`
        : `${categoriaTexto} - ${distribuicao.quantidadeGanhadores} ganhador${distribuicao.quantidadeGanhadores > 1 ? 'es' : ''} - Valor para cada premiado: R$${valorFormatado}`
      
      html += `
        <div class="prize-category">
          <h3>${categoriaTexto}</h3>
          <p class="category-summary">${textoResumo}</p>
          <div class="winners-list">
      `
      
      // MODIFIQUEI AQUI - Listar ganhadores: Código/Ticket | Nome (em minúsculas conforme exemplo)
      ganhadoresCategoria.forEach((ganhador: any) => {
        const ticketCode = ganhador.ticketCode || 'N/A'
        const userName = (ganhador.userName || 'N/A').toLowerCase()
        html += `
            <div class="winner-item">
              <span class="winner-ticket">${ticketCode}</span>
              <span class="winner-separator">|</span>
              <span class="winner-name">${userName}</span>
            </div>
        `
      })
      
      html += `
          </div>
        </div>
      `
    })

    html += `
      </div>
    `
  }

  html += `
    </body>
    </html>
  `

  return html
}

/**
 * Exporta relatório para PDF usando window.print()
 * MODIFIQUEI AQUI - Função para gerar PDF via print
 */
// MODIFIQUEI AQUI - Função auxiliar para mostrar modais de erro com ícones
function showErrorModal(title: string, message: string) {
  const iconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  `
  
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] animate-[fadeIn_0.2s_ease-out]'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-8 max-w-md mx-4 animate-[scaleIn_0.3s_ease-out] shadow-2xl">
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-500 mb-4">
          ${iconSvg}
        </div>
        <h3 class="text-xl font-bold text-[#1F1F1F] mb-2">${title}</h3>
        <p class="text-[#1F1F1F]/70 mb-6">${message}</p>
        <button class="px-6 py-2 bg-[#1E7F43] text-white rounded-lg hover:bg-[#3CCB7F] transition-colors font-semibold">
          Entendi
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  
  const closeBtn = modal.querySelector('button')
  const closeModal = () => {
    modal.remove()
  }
  closeBtn?.addEventListener('click', closeModal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal()
    }
  })
}

export function exportToPDF(reportData: ReportData, rateioData?: any): void {
  // MODIFIQUEI AQUI - Debug temporário para verificar dados
  console.log('Exportando PDF:', {
    reportType: reportData.reportType,
    contestStatus: reportData.contest.status,
    hasRateioData: !!rateioData,
    distribuicaoLength: rateioData?.distribuicao?.length,
    ganhadoresLength: rateioData?.ganhadores?.length
  })
  
  const html = generateReportHTML(reportData, rateioData)
  
  // MODIFIQUEI AQUI - Debug: verificar se HTML contém "FIM DO BOLÃO"
  console.log('HTML contém "FIM DO BOLÃO":', html.includes('FIM DO BOLÃO'))
  console.log('HTML contém "Resumo Final":', html.includes('Resumo Final do Bolão'))
  
  const printWindow = window.open('', '_blank')
  
  if (!printWindow) {
    showErrorModal(
      'Pop-up bloqueado',
      'Não foi possível abrir a janela de impressão. Verifique se os pop-ups estão bloqueados.'
    )
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()
  
  // Aguardar carregamento e abrir diálogo de impressão
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
