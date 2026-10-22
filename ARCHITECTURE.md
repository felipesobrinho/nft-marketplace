# Arquitetura

A Kurio é uma SPA em React e TypeScript. Toda a API, a sessão, as carteiras, o pagamento e o tempo real são simulados na camada de rede com MSW, então o mesmo código roda em desenvolvimento, na demonstração publicada e nos testes, sem backend.

## Stack

Obrigatórias: React, TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO (`socket.io-client`), Tailwind CSS, shadcn/ui, MSW, Playwright e Lighthouse.

| Complementar                                                                  | Por quê                                                                            |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Vite 8                                                                        | build e dev server indicados para a Vercel; a SPA não precisa de servidor          |
| pnpm 11                                                                       | lockfile determinística; é a versão mais nova que o corepack do Node 22 executa    |
| Zod 4                                                                         | uma fonte só de tipos para contratos REST, eventos, search params e formulários    |
| React Hook Form + `@hookform/resolvers`                                       | formulários com o mesmo schema Zod dos contratos                                   |
| `@msw/data`                                                                   | banco dos mocks com schema Zod, consultas e `persist()` para sobreviver ao refresh |
| `@mswjs/socket.io-binding`                                                    | fala o protocolo do Socket.IO sobre a interceptação de WebSocket do MSW            |
| bcryptjs                                                                      | hash das senhas no banco simulado; nenhuma senha fica em claro                     |
| Sonner                                                                        | toast oficial do shadcn para o retorno das mutations                               |
| lucide-react                                                                  | ícones do shadcn; substituem as letras usadas como ícone no Figma                  |
| `@fontsource/roboto-mono`                                                     | serve a fonte do Figma localmente, sem depender do Google Fonts                    |
| Vitest                                                                        | testes unitários do domínio, nativos do Vite                                       |
| `@axe-core/playwright`                                                        | auditoria de acessibilidade dentro dos E2E                                         |
| `@lhci/cli`                                                                   | Lighthouse com configuração versionada e três execuções por página                 |
| ESLint, `typescript-eslint`, `eslint-plugin-react-hooks`, plugins do TanStack | regras de camada, hooks e boas práticas do Router e do Query                       |
| Prettier                                                                      | um formato só, inclusive para os componentes gerados pelo shadcn                   |
| `@tanstack/router-cli`                                                        | gera a árvore de rotas antes de typecheck e lint, sem depender do Vite             |

Não usei Next.js, Redux, Zustand nem Jest. O estado remoto é todo do TanStack Query, o estado de URL é do TanStack Router e o resto é estado local do React.

### Versões fixadas abaixo da mais nova

| Pacote     | Fixado  | Mais novo | Por quê                                                                                           |
| ---------- | ------- | --------- | ------------------------------------------------------------------------------------------------- |
| TypeScript | 6.0.3   | 7.0       | `typescript-eslint` 8 aceita só até a 6.0                                                         |
| MSW        | 2.15.0  | 3.0       | `@mswjs/socket.io-binding` 0.2 exige MSW 2                                                        |
| pnpm       | 11.28.7 | 12.14     | o pnpm 12 é um binário nativo que o corepack do Node 22 não executa, nem localmente nem na Vercel |

## Camadas

Organização por módulo de negócio, com camadas dentro de cada módulo. Uma pasta só existe quando tem conteúdo.

```
src/
  app/        composição: entrada, providers, router, query client, bootstrap dos mocks
  routes/     rotas file-based; finas: validam search, chamam loader, montam a página
  modules/<módulo>/
    domain/          tipos e regras puras
    application/     hooks de caso de uso: queries, mutations, query keys, efeitos de eventos
    infrastructure/  chamadas Axios com parse Zod, listeners de socket, storage
    ui/              componentes e páginas do módulo
    index.ts         API pública do módulo
  shared/
    contracts/       schemas Zod de REST, erro e eventos, usados pela app e pelos mocks
    domain/          ETH em BigInt, ApiError, formatadores, filtro de eventos
    infrastructure/  cliente Axios, cliente Socket.IO
    ui/              shadcn adaptado, sistema de design, layout, feedback
  mocks/             banco, handlers REST, tempo real, cenários, controle
```

O ESLint (`no-restricted-imports`) garante as dependências:

- `domain` e `contracts` não importam React, Axios, TanStack, Socket.IO nem as outras camadas.
- `ui` e `routes` não importam `infrastructure`, Axios nem Socket.IO; passam pelos hooks de `application`.
- Um módulo importa outro só pelo `index.ts`.
- `mocks` importa só `shared/contracts` e `shared/domain`.
- Nada da app importa `mocks` de forma estática. O único ponto de entrada é `src/app/bootstrap.ts`, por import dinâmico condicionado a `VITE_API_MOCKING=enabled`.

## Valores em ETH

Preços trafegam como string decimal com ponto. As contas usam BigInt em wei (18 casas) em `shared/domain/eth`, então `0.1 + 0.2` dá `0.3` e `1.79 x 9` dá `16.11`. Um formatador único (`shared/domain/format`) mostra de 2 a 4 casas com ponto, como a maior parte do Figma. A cotação da API é a referência para fechar o pedido.

## Erros, cache e retries

- O Axios converte toda falha num `ApiError` tipado: `http` (com `status`, `code`, `fields` e `details` do envelope `{ error: { code, message, fields?, details? } }`), `network`, `timeout`, `canceled` e `invalid_response`. Toda resposta passa por um schema Zod antes de chegar ao cache.
- Consultas: `staleTime` de 30 s, `gcTime` de 5 min, sem refetch ao focar a janela.
- Retry só em rede, timeout e 5xx, no máximo duas vezes, com espera de 0,5 s, 1 s e 2 s (teto de 4 s). Nunca em 4xx: repetir um 409 ou 422 não muda o resultado.
- Mutations não repetem sozinhas.

## Fora do escopo

Ações fora do escopo do desafio nunca aparentam sucesso. Elas abrem o aviso "Indisponível nesta demonstração", que diz o que não faz parte da entrega.

| Onde   | Item                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------ |
| Header | Criadores, Aprenda                                                                               |
| Footer | Minha coleção, Atividade, Estúdio do criador, toda a Central de ajuda, redes sociais, newsletter |

## Acessibilidade

- Contraste AA conferido em todos os pares de texto e fundo; dois tons do Figma foram ajustados (tabela em `docs/design.md`).
- Link "Pular para o conteúdo" como primeiro foco da página.
- Anel de foco de 2 px em todo elemento focável.
- Região `aria-live` única (`LiveAnnouncer`) para avisos de mutation e de tempo real.

## Desvios do Figma

| Id        | Tela   | Era                                                                    | Ficou                                                              | Por quê                                                              |
| --------- | ------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| U1        | Todas  | duas variantes de header, uma com borda inferior                       | um header só, sem borda                                            | consistência entre telas                                             |
| G5        | Todas  | navegação 6 px acima do logo; "Início" ativo em Perfil e Carteiras     | itens centralizados na mesma linha; item ativo pela rota           | alinhamento e estado correto                                         |
| U7        | Footer | selo "Carteiras compatíveis" com 10,5 px à esquerda e 2,5 px à direita | padding simétrico                                                  | o texto encostava na borda                                           |
| I8        | Footer | "Enviar" maior que o resto; recuos de 168 e 152 px entre as faixas     | escala tipográfica e recuo único nas três faixas                   | consistência                                                         |
| G9        | Footer | letras "W", "C" e "D" como ícone                                       | ícones do lucide em caixa redonda de tamanho único                 | ícone com significado                                                |
| Redes     | Footer | ícones de Facebook, Instagram, Twitter, LinkedIn e YouTube             | botões de texto com o nome da rede                                 | o lucide 1.x não tem ícones de marca e as redes estão fora do escopo |
| M1        | Mobile | botão flutuante central sem função; barra só com ícones                | barra com Início, Favoritos, Carrinho e Perfil, com rótulo visível | o botão não tinha função; rótulo ajuda a reconhecer o destino        |
| G1, G2    | Todas  | 57 combinações de fonte; entrelinha menor que a fonte                  | 8 tokens de texto com entrelinha mínima de 1,25x                   | textos cortados e hierarquia instável                                |
| G3        | Todas  | 30 raios (3 a 40)                                                      | `sm` 4, `md` 8, `lg` 16 e `full`, iguais no desktop e no mobile    | consistência                                                         |
| G4, G13   | Todas  | mais de 50 paddings; gutter mobile de 24 e 28                          | escala de 4 px; gutter de 24 em todas as larguras                  | consistência                                                         |
| G6        | Todas  | botões em caixa alta em uns e não em outros, rótulos descentralizados  | um Button sem caixa alta, rótulo centralizado                      | consistência                                                         |
| Contraste | Campos | erro `#ed1b2e` (4,4:1) e borda de campo `#3f2319` (1,3:1)              | `#ff5a5f` (6,3:1) e `#8a6646` (3,7:1)                              | AA para texto e 3:1 para borda de campo                              |
