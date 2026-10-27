export class IntegrationNotConfiguredError extends Error {
  readonly provider: string;
  readonly envKeys: readonly string[];

  constructor(provider: string, envKeys: readonly string[]) {
    super(
      `Integração "${provider}" não configurada. Defina as variáveis: ${envKeys.join(", ")}.`,
    );
    this.name = "IntegrationNotConfiguredError";
    this.provider = provider;
    this.envKeys = envKeys;
  }
}

export class IntegrationDisabledInDemoError extends Error {
  readonly provider: string;

  constructor(provider: string) {
    super(
      `A integração "${provider}" está desabilitada no modo demonstração. Nenhuma cobrança, mensagem ou pedido real foi enviado.`,
    );
    this.name = "IntegrationDisabledInDemoError";
    this.provider = provider;
  }
}
