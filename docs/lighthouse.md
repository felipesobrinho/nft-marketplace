# Lighthouse

Auditoria do início e do detalhe de um NFT fixo, nos perfis mobile e desktop, com o build de demonstração (`pnpm build:demo`), o cenário padrão dos mocks e três execuções por página e perfil. A tabela mostra a mediana.

## Resultado

| Perfil  | Página                     | Performance      | Accessibility | Best Practices | SEO | LCP    | CLS   | TBT    |
| ------- | -------------------------- | ---------------- | ------------- | -------------- | --- | ------ | ----- | ------ |
| Mobile  | Início                     | **75** (meta 90) | 96            | 100            | 100 | 4.52 s | 0.000 | 172 ms |
| Mobile  | Detalhe (Emerald Ape #042) | **78** (meta 90) | 96            | 100            | 100 | 4.24 s | 0.000 | 115 ms |
| Desktop | Início                     | 98               | 96            | 100            | 100 | 1.02 s | 0.000 | 0 ms   |
| Desktop | Detalhe (Emerald Ape #042) | 99               | 96            | 100            | 100 | 0.91 s | 0.000 | 0 ms   |

Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90. Valor abaixo da meta aparece em negrito.

## Ambiente

| Item                           | Valor                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Data                           | 21/10/2026                                                                                                              |
| Lighthouse                     | 12.6.1                                                                                                                  |
| @lhci/cli                      | 0.15.1                                                                                                                  |
| Node.js                        | v22.16.0                                                                                                                |
| Navegador                      | Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36 |
| Índice de benchmark da máquina | 2249.5                                                                                                                  |
| Sistema                        | win32 x64                                                                                                               |

## Condições

- Build `pnpm build:demo` servido por `vite preview` em `http://localhost:4173`, com o MSW ligado e o cenário padrão.
- Mobile: emulação padrão do Lighthouse (tela de celular, CPU 4x mais lenta e rede 4G simulada).
- Desktop: preset `desktop` do Lighthouse (sem limitação de CPU e rede rápida).
- Três execuções por página e perfil; configuração em `lighthouserc.json`; comando `pnpm lighthouse`.
- Relatórios HTML e JSON de cada execução em `lighthouse/mobile` e `lighthouse/desktop`.
