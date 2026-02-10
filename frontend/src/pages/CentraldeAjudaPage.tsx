import SitePage from './SitePage'

export default function CentralDeAjudaPage() {
  return (
    <SitePage
      pageKey="central-de-ajuda"
      title="Central de Ajuda"
      subtitle="Dúvidas frequentes e orientações rápidas."
      defaultContent={`## Central de Ajuda\n\n- Dúvida 1...\n- Dúvida 2...\n\n> Se precisar, fale com o suporte.`}
    />
  )
}
