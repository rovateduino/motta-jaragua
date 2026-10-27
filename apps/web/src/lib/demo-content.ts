/**
 * Informações FICTÍCIAS da loja usadas na demonstração.
 * Endereço, telefone e regras oficiais serão confirmados com o Mercado Motta.
 */

export const demoStoreInfo = {
  city: "Jaraguá do Sul",
  state: "SC",
  cepPlaceholder: "Informar CEP",
  deliveryNote: "Regras de entrega serão confirmadas com o Mercado Motta.",
  pickupNote: "Retirada na loja com janela de horário a definir.",
};

/** Regras FICTÍCIAS usadas apenas no checkout demonstrativo. */
export const demoCheckoutRules = {
  freeShippingThresholdCents: 15000,
  deliveryFeeCents: 990,
  minimumOrderCents: 3000,
  pickupSlots: [
    { value: "hoje-18-21", label: "Hoje, das 18h às 21h" },
    { value: "amanha-09-12", label: "Amanhã, das 9h às 12h" },
    { value: "amanha-14-18", label: "Amanhã, das 14h às 18h" },
  ],
} as const;

export const demoSubstitutionOptions = [
  {
    value: "CONTACT_BEFORE",
    label: "Falar comigo antes de substituir",
    description: "A equipe demonstrativa entraria em contato antes de trocar um item.",
  },
  {
    value: "ACCEPT_EQUIVALENT",
    label: "Aceito produto equivalente",
    description: "Permite trocar por outro item de valor e marca semelhantes.",
  },
  {
    value: "DO_NOT_SUBSTITUTE",
    label: "Não substituir",
    description: "Se faltar, o item seria removido do pedido.",
  },
  {
    value: "REMOVE_ITEM",
    label: "Remover o item se faltar",
    description: "O item indisponível sairia do pedido sem substituição.",
  },
] as const;
