/**
 * Aviso amigável exibido quando o catálogo não pôde ser carregado do banco
 * (falha de conexão, loja inexistente ou catálogo vazio). Mantém a loja no ar
 * em vez de quebrar a página.
 */
export function CatalogMaintenance() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-motta-gray-200 bg-white p-8 text-center">
      <h1 className="text-2xl font-black tracking-tight text-motta-ink">
        Catálogo em manutenção
      </h1>
      <p className="mt-2 text-sm text-motta-gray-500">
        Não foi possível carregar os produtos agora. Estamos ajustando a loja —
        tente novamente em instantes.
      </p>
    </div>
  );
}
