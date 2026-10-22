# Kurio, marketplace de NFTs

Marketplace de NFTs em React e TypeScript feito para o desafio de frontend da Jungle Gaming. Catálogo, detalhe, carrinho, pagamento, conta e tempo real funcionam contra uma API simulada com MSW, sem backend.

## Requisitos

| Ferramenta | Versão                         | Observação                                 |
| ---------- | ------------------------------ | ------------------------------------------ |
| Node.js    | 22.13 ou mais novo da linha 22 | fixado em `.nvmrc`                         |
| pnpm       | 11.28.7                        | vem pelo corepack, que acompanha o Node 22 |

O pnpm 12 não roda pelo corepack do Node 22, por isso o projeto fixa o 11. Se a máquina já tiver outro pnpm global, use `corepack pnpm` no lugar de `pnpm` em todos os comandos.

## Como rodar

```bash
corepack enable
pnpm install
pnpm dev
```

A aplicação abre em `http://localhost:5173` com os mocks ligados.

## Variáveis de ambiente

Os arquivos `.env.development` e `.env.demo` já vêm com os valores da demonstração. `.env.example` lista todas.

| Variável            | Padrão    | Para quê                                     |
| ------------------- | --------- | -------------------------------------------- |
| `VITE_API_MOCKING`  | `enabled` | liga o MSW (REST e Socket.IO simulados)      |
| `VITE_API_BASE_URL` | `/api`    | base das chamadas REST                       |
| `VITE_SOCKET_URL`   | vazio     | servidor Socket.IO; vazio usa a mesma origem |

## Comandos

| Comando             | O que faz                                                          |
| ------------------- | ------------------------------------------------------------------ |
| `pnpm dev`          | servidor de desenvolvimento com mocks                              |
| `pnpm build`        | build de produção                                                  |
| `pnpm build:demo`   | build da demonstração publicada, com mocks                         |
| `pnpm preview`      | serve o build em `http://localhost:4173`                           |
| `pnpm typecheck`    | verificação de tipos                                               |
| `pnpm lint`         | ESLint com as regras de camada e varredura de comentários e emojis |
| `pnpm format:check` | confere a formatação                                               |
| `pnpm test`         | testes unitários (Vitest)                                          |
| `pnpm test:e2e`     | testes E2E (Playwright, Chromium desktop 1440 e mobile 390)        |
| `pnpm test:visual`  | regressão visual                                                   |
| `pnpm lighthouse`   | auditoria Lighthouse                                               |

Antes do primeiro `pnpm test:e2e`, instale o navegador: `pnpm exec playwright install chromium`.

## Documentação

- `ARCHITECTURE.md`: camadas, decisões, cache, sessão, carrinho, tempo real e desvios do Figma.
- `docs/design.md`: sistema de design (cores, tipografia, espaçamento, raios, componentes).
