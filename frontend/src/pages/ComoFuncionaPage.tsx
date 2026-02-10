import SitePage from './SitePage'

export default function ComoFuncionaPage() {
  return (
    <SitePage
      pageKey="como-funciona"
      title="Como Funciona"
      subtitle="Entenda o fluxo de participação e acompanhamento dos sorteios."
      defaultContent={`## Como funciona\n\nCole aqui o texto em Markdown...`}
    />
  )
}
