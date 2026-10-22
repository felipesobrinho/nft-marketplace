# Lighthouse

Auditoria do início e do detalhe de um NFT fixo, nos perfis mobile e desktop, com o build de demonstração (`pnpm build:demo`), o cenário padrão dos mocks e três execuções por página e perfil. A tabela mostra a mediana.

## Resultado

| Perfil  | Página                     | Performance      | Accessibility | Best Practices | SEO | LCP    | CLS   | TBT    |
| ------- | -------------------------- | ---------------- | ------------- | -------------- | --- | ------ | ----- | ------ |
| Mobile  | Início                     | **61** (meta 90) | 100           | 100            | 100 | 5.48 s | 0.000 | 513 ms |
| Mobile  | Detalhe (Emerald Ape #042) | **65** (meta 90) | 100           | 100            | 100 | 5.13 s | 0.000 | 406 ms |
| Desktop | Início                     | 96               | 100           | 100            | 100 | 1.27 s | 0.000 | 17 ms  |
| Desktop | Detalhe (Emerald Ape #042) | 96               | 100           | 100            | 100 | 1.24 s | 0.000 | 12 ms  |

Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90. Valor abaixo da meta aparece em negrito.

## Ambiente

| Item                           | Valor                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Data                           | 22/10/2026                                                                                                              |
| Lighthouse                     | 12.6.1                                                                                                                  |
| @lhci/cli                      | 0.15.1                                                                                                                  |
| Node.js                        | v22.16.0                                                                                                                |
| Navegador                      | Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36 |
| Índice de benchmark da máquina | 1803.5                                                                                                                  |
| Sistema                        | win32 x64                                                                                                               |

## Condições

- Build `pnpm build:demo` servido por `vite preview` em `http://localhost:4173`, com o MSW ligado e o cenário padrão.
- Mobile: emulação padrão do Lighthouse (tela de celular, CPU 4x mais lenta e rede 4G simulada).
- Desktop: preset `desktop` do Lighthouse (sem limitação de CPU e rede rápida).
- Três execuções por página e perfil; configuração em `lighthouserc.json`; comando `pnpm lighthouse`.
- Relatórios HTML e JSON de cada execução em `lighthouse/mobile` e `lighthouse/desktop`.

## O que foi feito na fase de performance

| Mudança                                                 | Efeito medido (mobile, início)                                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sideEffects` no `package.json`                         | JS pedido pelo `index.html` caiu de 275 KB para 230 KB gzip. Os `index.ts` dos módulos reexportam telas e componentes que a primeira página não usa; sem a marcação, o bundler mantinha esses módulos. |
| CSS embutido no `index.html` e casca estática do header | O primeiro pixel não depende mais do CSS disputar banda com os módulos JS. FCP de 4,0 s para 3,1 s.                                                                                                    |
| `modulepreload` do pacote do MSW com prioridade baixa   | O pacote começa a baixar junto com o resto, sem passar na frente do código da página.                                                                                                                  |
| Banco simulado e service worker iniciados em paralelo   | Antes, o worker só registrava depois de abrir o banco. As requisições `/api` e `/__mock` esperam o banco antes de chegar aos handlers.                                                                 |

## Por que o mobile não chega a 90

O elemento de LCP no mobile é a imagem do primeiro card do catálogo. Na divisão do LCP medida pelo Lighthouse, quase todo o tempo é atraso até a imagem ser pedida (cerca de 3,3 a 3,7 s), e não download da imagem (cerca de 0,1 a 0,2 s). A imagem só é pedida depois de quatro etapas em sequência:

1. o JavaScript da página baixa e executa, com a CPU 4x mais lenta da emulação;
2. o pacote do MSW (cerca de 196 KB gzip: `msw`, `@msw/data`, o binding do Socket.IO, o seed e os handlers) baixa e executa;
3. o service worker do MSW é registrado e passa a controlar a página, sempre do zero, porque cada execução do Lighthouse usa um perfil novo;
4. o banco simulado abre e a API simulada responde com a latência do cenário padrão (80 a 300 ms).

No tempo de CPU medido nas três execuções do início no mobile, o pacote principal custa cerca de 0,9 a 1,0 s e o pacote do MSW cerca de 0,6 s, o que explica o TBT de 400 a 530 ms.

As etapas 2 a 4 existem porque a API inteira roda no navegador, como o desafio pede. Com uma API real, a página faria a requisição assim que o JavaScript da etapa 1 terminasse.

No desktop, sem limitação de CPU e com rede rápida, as mesmas etapas cabem no orçamento e as metas são atingidas.

A máquina também pesa no número. A medição da fase do início (21/10) foi feita com índice de benchmark 2249 e deu 75 no início e 78 no detalhe. Esta foi feita com índice 1803, com pouca memória livre na máquina. O Lighthouse aplica a lentidão de 4x sobre a CPU real, então uma máquina mais lenta derruba a nota do mobile mesmo sem mudança de código. As notas de acessibilidade, boas práticas e SEO não dependem disso e ficaram em 100.

## O que não foi feito e por quê

- Pré-renderizar o catálogo no HTML ou embutir o seed no bundle principal: o enunciado pede que os dados venham da API, e a API é o MSW. Os dois atalhos fariam a tela não depender da API simulada.
- Trocar o cenário padrão por latência zero: a latência de 80 a 300 ms faz parte da simulação e é o que os estados de carregamento mostram.
- Separar o seed do pacote do MSW em outro arquivo: o seed precisa existir antes da primeira resposta, então só trocaria um download por dois.
