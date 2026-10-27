export interface NavItem {
  label: string;
  href: string;
}

export const primaryNav: NavItem[] = [
  { label: "Início", href: "/" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Catálogo", href: "/catalogo" },
      { label: "Meus pedidos", href: "/pedidos" },
  { label: "Atendimento", href: "/em-construcao?recurso=atendimento" },
];

export const footerColumns: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Compras",
    items: [
      { label: "Catálogo completo", href: "/catalogo" },
      { label: "Ofertas da semana", href: "/ofertas" },
      { label: "Meu carrinho", href: "/carrinho" },
    ],
  },
  {
    title: "Atendimento",
    items: [
      { label: "Central de ajuda", href: "/em-construcao?recurso=atendimento" },
      { label: "Entrega e retirada", href: "/em-construcao?recurso=entrega" },
  { label: "Meus pedidos", href: "/pedidos" },
    ],
  },
  {
    title: "Institucional",
    items: [
      { label: "Sobre o Mercado Motta", href: "/em-construcao?recurso=institucional" },
      { label: "Trabalhe conosco", href: "/em-construcao?recurso=trabalhe-conosco" },
      { label: "Painel administrativo", href: "/painel" },
    ],
  },
  {
    title: "Privacidade",
    items: [
      { label: "Política de privacidade", href: "/em-construcao?recurso=privacidade" },
      { label: "Termos de uso", href: "/em-construcao?recurso=termos" },
      { label: "Canal LGPD", href: "/em-construcao?recurso=lgpd" },
    ],
  },
];

export function constructionHref(resource: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ recurso: resource, ...extra });
  return `/em-construcao?${params.toString()}`;
}
