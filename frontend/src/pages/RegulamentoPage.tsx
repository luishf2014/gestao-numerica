import SitePage from './SitePage'

export default function RegulamentoPage() {
  return (
    <SitePage
      pageKey="regulamento"
      title="Regulamento"
      subtitle="Regras e critérios oficiais de participação e apuração."
      defaultContent={`## Regulamento\n\nCole aqui o texto em Markdown...`}
    />
  )
}
