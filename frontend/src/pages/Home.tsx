/**
 * Página inicial da aplicação
 * FASE 1: Apenas estrutura base
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Gestão Numérica - Concursos
        </h1>
        <p className="text-gray-600">
          Plataforma configurável de gestão de concursos numéricos
        </p>
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Status do Sistema</h2>
          <p className="text-sm text-gray-600">
            FASE 1 - Fundação do Sistema: Estrutura base configurada
          </p>
        </div>
      </div>
    </div>
  )
}
