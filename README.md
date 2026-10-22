# Kurio, marketplace de NFTs

Marketplace de NFTs em React e TypeScript feito para o desafio de frontend da Jungle Gaming. Catálogo, detalhe, carrinho, pagamento, conta e tempo real funcionam contra uma API simulada com MSW, sem backend.

Demonstração publicada: https://nft-marketplace-gray-two.vercel.app (mesmo build de `pnpm build:demo`, com os mocks rodando no navegador).

## Requisitos

| Ferramenta | Versão                         | Observação                                 |
| ---------- | ------------------------------ | ------------------------------------------ |
| Node.js    | 22.13 ou mais novo da linha 22 | fixado em `.nvmrc`                         |
| pnpm       | 11.28.7                        | vem pelo corepack, que acompanha o Node 22 |

O pnpm 12 não roda pelo corepack do Node 22, por isso o projeto fixa o 11. Se a máquina já tiver outro pnpm global, use `corepack pnpm` no lugar de `pnpm` em todos os comandos.

No Windows, clone o projeto num caminho curto (por exemplo `C:\dev\nft-marketplace`). O `node_modules` do pnpm cria caminhos longos, e numa pasta já profunda o Vitest falha ao iniciar com `ERR_PACKAGE_IMPORT_NOT_DEFINED`.

## Como rodar

```bash
corepack enable
pnpm install
pnpm dev
```

A aplicação abre em `http://localhost:5173` com os mocks ligados.

## Credenciais fictícias

| Usuário     | E-mail              | Senha       | O que tem                                                          |
| ----------- | ------------------- | ----------- | ------------------------------------------------------------------ |
| Ana Lima    | `ana@jungle.test`   | `Senha@123` | carteiras principal (Ethereum) e secundária (Polygon), 3 favoritos |
| Bruno Costa | `bruno@jungle.test` | `Senha@123` | nenhuma carteira, para testar o cadastro de carteira               |

Cupons: `JUNGLE10` (10%, válido) e `VELHO20` (expirado). As senhas existem só como hash bcrypt no banco simulado.

## Cenários e reset

A API simulada tem 18 cenários determinísticos (lentidão, falhas, sessão expirada, preço que muda na compra, timeout do pedido, pagamento recusado etc.). Escolha pela URL (`/?scenario=slow`), pelo painel de demonstração (botão redondo no canto inferior direito) ou por `PUT /__mock/scenario`. "Restaurar dados iniciais" no painel ou `POST /__mock/reset` volta ao seed. A lista completa, com o passo a passo para reproduzir cada falha, está em `docs/cenarios.md`.

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

## Regressão visual

`e2e/visual.spec.ts` compara início, detalhe, carrinho e as etapas de dados e revisão do pagamento, no desktop (1440) e no mobile (390), com o seed, relógio fixo (`page.clock`), animações desligadas, fontes e imagens carregadas e o botão da demonstração mascarado.

As imagens de referência valem para Linux e ficam em `e2e/visual.spec.ts-snapshots/*-linux.png`, geradas pelo GitHub Actions, porque a renderização de fonte muda entre sistemas. No Windows e no macOS, `pnpm test:visual --update-snapshots` gera referências locais com sufixo `-win32` ou `-darwin`, ignoradas pelo git.

Para atualizar as referências do Linux depois de uma mudança visual intencional, rode o workflow `visual-baselines` na aba Actions, baixe o artefato `visual-baselines` e substitua os arquivos em `e2e/visual.spec.ts-snapshots/`. O job `visual` do CI compara a cada push e guarda as diferenças no artefato `visual-snapshots`.

## Documentação

- `ARCHITECTURE.md`: camadas, decisões, cache, sessão, carrinho, tempo real e desvios do Figma.
- `docs/design.md`: sistema de design (cores, tipografia, espaçamento, raios, componentes).
- `docs/api.md`: contratos REST, envelope de erro e códigos.
- `docs/eventos.md`: transporte do tempo real, envelope dos eventos, como disparar e limitações.
- `docs/cenarios.md`: cenários, dados iniciais, endpoints de controle e persistência.
- `docs/lighthouse.md`: medianas do Lighthouse, ambiente da medição e análise do resultado no mobile.
