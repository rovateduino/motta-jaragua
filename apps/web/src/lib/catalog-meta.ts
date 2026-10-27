/**
 * Metadados de apresentação da vitrine para itens do banco de dados.
 *
 * O PostgreSQL é a fonte dos dados do catálogo (nome, marca, descrição,
 * preço, estoque, promoções e departamentos). Estes campos são puramente
 * visuais/operacionais e não possuem coluna no schema atual: emoji, tom de
 * gradiente, rótulo de embalagem e popularidade. Produtos ou departamentos
 * novos, sem entrada aqui, caem em fallbacks neutros na montagem do catálogo.
 */

export interface ProductMeta {
  readonly emoji: string;
  readonly imageTone: string;
  readonly packageLabel: string;
  readonly popularity: number;
  /** Limite de compra por pedido em milésimos da unidade de venda. */
  readonly maxOrderQuantityMilli?: number;
}

export interface CategoryMeta {
  readonly tagline: string;
  readonly description: string;
  readonly imageTone: string;
}

export const productMeta: Readonly<Record<string, ProductMeta>> = {
  "arroz-tipo-1-5kg": {
    emoji: "🍚",
    imageTone: "from-amber-50 to-white",
    packageLabel: "Pacote de 5 kg",
    popularity: 96,
  },
  "feijao-carioca-1kg": {
    emoji: "🍲",
    imageTone: "from-stone-100 to-white",
    packageLabel: "Pacote de 1 kg",
    popularity: 88,
  },
  "oleo-de-soja-900ml": {
    emoji: "🌻",
    imageTone: "from-yellow-50 to-white",
    packageLabel: "Frasco de 900 ml",
    popularity: 75,
  },
  "macarrao-espaguete-500g": {
    emoji: "🍝",
    imageTone: "from-amber-100 to-white",
    packageLabel: "Pacote de 500 g",
    popularity: 72,
  },
  "cafe-torrado-e-moido-500g": {
    emoji: "☕",
    imageTone: "from-orange-100 to-white",
    packageLabel: "Pacote de 500 g",
    popularity: 91,
  },
  "banana-prata": {
    emoji: "🍌",
    imageTone: "from-yellow-50 to-white",
    packageLabel: "Vendida por kg",
    popularity: 97,
    maxOrderQuantityMilli: 5000,
  },
  tomate: {
    emoji: "🍅",
    imageTone: "from-red-50 to-white",
    packageLabel: "Vendido por kg",
    popularity: 84,
  },
  "batata-inglesa": {
    emoji: "🥔",
    imageTone: "from-amber-50 to-white",
    packageLabel: "Vendida por kg",
    popularity: 79,
  },
  "alface-crespa": {
    emoji: "🥬",
    imageTone: "from-lime-50 to-white",
    packageLabel: "Unidade",
    popularity: 68,
  },
  "picanha-bovina": {
    emoji: "🥩",
    imageTone: "from-red-50 to-white",
    packageLabel: "Vendida por kg",
    popularity: 94,
  },
  "frango-inteiro": {
    emoji: "🍗",
    imageTone: "from-orange-50 to-white",
    packageLabel: "Vendido por kg",
    popularity: 87,
  },
  "linguica-toscana": {
    emoji: "🌭",
    imageTone: "from-rose-50 to-white",
    packageLabel: "Vendida por kg",
    popularity: 73,
  },
  "pao-frances": {
    emoji: "🥖",
    imageTone: "from-orange-50 to-white",
    packageLabel: "Vendido por kg",
    popularity: 92,
  },
  "bolo-de-cenoura-400g": {
    emoji: "🍰",
    imageTone: "from-amber-100 to-white",
    packageLabel: "Unidade de 400 g",
    popularity: 81,
  },
  "leite-integral-1l": {
    emoji: "🥛",
    imageTone: "from-blue-50 to-white",
    packageLabel: "Caixa de 1 L",
    popularity: 95,
  },
  "queijo-mussarela": {
    emoji: "🧀",
    imageTone: "from-yellow-50 to-white",
    packageLabel: "Vendido por kg",
    popularity: 86,
  },
  "manteiga-200g": {
    emoji: "🧈",
    imageTone: "from-yellow-50 to-white",
    packageLabel: "Pote de 200 g",
    popularity: 74,
  },
  "refrigerante-cola-2l": {
    emoji: "🥤",
    imageTone: "from-zinc-100 to-white",
    packageLabel: "Garrafa de 2 L",
    popularity: 89,
  },
  "suco-de-uva-integral-1l": {
    emoji: "🍇",
    imageTone: "from-purple-50 to-white",
    packageLabel: "Garrafa de 1 L",
    popularity: 67,
  },
  "detergente-500ml": {
    emoji: "🧴",
    imageTone: "from-sky-50 to-white",
    packageLabel: "Frasco de 500 ml",
    popularity: 83,
  },
  "sabao-em-po-1kg": {
    emoji: "🧺",
    imageTone: "from-blue-50 to-white",
    packageLabel: "Pacote de 1 kg",
    popularity: 70,
  },
  "papel-higienico-12-rolos": {
    emoji: "🧻",
    imageTone: "from-violet-50 to-white",
    packageLabel: "Pacote com 12 rolos",
    popularity: 78,
  },
  "shampoo-350ml": {
    emoji: "🧴",
    imageTone: "from-violet-100 to-white",
    packageLabel: "Frasco de 350 ml",
    popularity: 62,
  },
  "pizza-congelada-460g": {
    emoji: "🍕",
    imageTone: "from-red-50 to-white",
    packageLabel: "Unidade de 460 g",
    popularity: 76,
  },
  "ervilha-congelada-400g": {
    emoji: "🥦",
    imageTone: "from-emerald-50 to-white",
    packageLabel: "Pacote de 400 g",
    popularity: 55,
  },
  "racao-para-caes-3kg": {
    emoji: "🐕",
    imageTone: "from-stone-100 to-white",
    packageLabel: "Pacote de 3 kg",
    popularity: 64,
  },
};

export const categoryMeta: Readonly<Record<string, CategoryMeta>> = {
  hortifruti: {
    tagline: "Frescor todos os dias",
    description: "Frutas, verduras e legumes selecionados para a sua casa.",
    imageTone: "from-lime-50 to-white",
  },
  "acougue-e-aves": {
    tagline: "Corte na medida",
    description: "Carnes bovinas, aves e embutidos com atendimento de açougue.",
    imageTone: "from-red-50 to-white",
  },
  padaria: {
    tagline: "Quentinho do forno",
    description: "Pães, bolos e produtos assados ao longo do dia.",
    imageTone: "from-orange-50 to-white",
  },
  "laticinios-e-frios": {
    tagline: "Direto da serra",
    description: "Leites, queijos, manteigas e frios para o dia a dia.",
    imageTone: "from-amber-50 to-white",
  },
  mercearia: {
    tagline: "O básico bem feito",
    description: "Itens essenciais da despensa, do arroz ao café.",
    imageTone: "from-yellow-50 to-white",
  },
  bebidas: {
    tagline: "Gelada na medida",
    description: "Refrigerantes, sucos e opções para acompanhar as refeições.",
    imageTone: "from-sky-50 to-white",
  },
  limpeza: {
    tagline: "Casa limpa e leve",
    description: "Detergentes, sabões e itens para toda a rotina da casa.",
    imageTone: "from-blue-50 to-white",
  },
  "higiene-pessoal": {
    tagline: "Cuidado para todos",
    description: "Produtos de higiene e cuidados pessoais para a família.",
    imageTone: "from-violet-50 to-white",
  },
  congelados: {
    tagline: "Praticidade congelada",
    description: "Pratos e vegetais congelados para refeições rápidas.",
    imageTone: "from-cyan-50 to-white",
  },
  "pet-shop": {
    tagline: "Amigos bem cuidados",
    description: "Alimentação e cuidados básicos para os pets da casa.",
    imageTone: "from-stone-100 to-white",
  },
};
