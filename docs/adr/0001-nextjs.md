# ADR 0001 — Next.js 15 para a loja e o painel

- **Data:** 24/10/2026
- **Status:** Aceito
- **Contexto:** decisão entre Next.js e React + Vite, conforme o documento de arquitetura do projeto.

## Decisão

Adotar **Next.js 15 (App Router) + React 19 + TypeScript** como framework da loja
virtual e do futuro painel administrativo, em um monólito modular com pacotes
compartilhados (`domain`, `contracts`, `db`, `ui`, `integrations`).

## Justificativa

1. **SEO e descoberta local:** páginas de produto e departamento precisam ser
   indexáveis; SSR/ISR e metadados estruturados são nativos.
2. **Performance:** renderização no servidor, otimização de imagens e streaming
   reduzem o custo em celulares modestos, público relevante no varejo regional.
3. **Simplicidade operacional:** loja e painel no mesmo deploy, com route groups
   e autorização server-side, sem manter dois projetos separados nesta fase.
4. **Evolução:** route handlers permitem expor `/api/v1` sem criar um serviço
   adicional prematuro. Se a carga ou as integrações exigirem, a API pode ser
   extraída depois, pois as regras já vivem em `packages/domain`.

## Alternativa descartada

**React + Vite (SPA) + Fastify.** É aderente ao texto original do documento, mas
prejudica SEO orgânico e exige mais infraestrutura desde o início. Pode ser
reconsiderada se o Mercado Motta priorizar um painel interno separado e não
depender de busca orgânica.

## Consequências

- Necessidade de disciplina para não acoplar regras de negócio a componentes
  React: regras ficam em `packages/domain` e validações em `packages/contracts`.
- Deploy inicial em plataforma compatível com Next.js (Vercel/Cloudflare) ou
  container Node.
- SEO só é efetivo quando `APP_MODE=production`; no demo, as páginas usam
  `noindex`.
