# Sistema de design

O Figma da Kurio tem a identidade certa, mas usa 57 combinações de fonte, 30 raios e paddings diferentes em componentes iguais. Este documento fixa um padrão só. Os tokens moram no `@theme` de `src/app/styles.css`; as escalas padrão de cor, texto, raio e sombra do Tailwind foram zeradas e declaradas segundo o projeto. As utilities de cores básicas transparent, current, white e black permanecem disponíveis.

## Cores

Os estilos nomeados do Figma viraram tokens. A coluna "Contraste" mede o texto sobre o fundo da página (`#140d0a`) e sobre o card (`#241612`). A meta é AA: 4,5:1 para texto e 3:1 para borda de campo.

| Token                                            | Valor     | Estilo no Figma      | Uso                              | Contraste           |
| ------------------------------------------------ | --------- | -------------------- | -------------------------------- | ------------------- |
| `background`                                     | `#140d0a` | Color/Ink            | fundo da página                  | —                   |
| `card`, `popover`                                | `#241612` | Color/Surface Card   | cards, painéis, modais           | —                   |
| `surface-raised`, `secondary`, `muted`, `accent` | `#2f1d15` | Color/Surface Raised | hover, fundo de item, skeleton   | —                   |
| `surface-dark`                                   | `#38220f` | Color/Surface Dark   | faixa do footer                  | —                   |
| `foreground`                                     | `#f5f1eb` | Color/Foreground     | texto principal                  | 17,1 · 15,6         |
| `muted-foreground`                               | `#cfb28c` | Text/Secondary       | descrições                       | 9,5 · 8,7           |
| `subtle`                                         | `#b39463` | Color/Secondary      | legendas, ID do token            | 6,7 · 6,1           |
| `highlight`                                      | `#e89b55` | Text/Accent          | preços, item ativo               | 8,5 · 7,7           |
| `primary`                                        | `#d28a4c` | Color/Primary        | botão principal, foco de borda   | 6,9 · 6,2           |
| `primary-foreground`                             | `#140d0a` | Color/Ink            | texto sobre o botão principal    | 6,9 sobre `primary` |
| `coral`                                          | `#f0805f` | Text/Coral           | asterisco de obrigatório         | 7,3 · 6,6           |
| `amber`                                          | `#e3a44e` | Color/Amber          | estrelas da avaliação            | 8,9 · 8,1           |
| `success`                                        | `#00a66c` | Color/Success        | pedido confirmado                | 6,1 · 5,6           |
| `destructive`                                    | `#ff5a5f` | Color/Error ajustado | erro de campo e de operação      | 6,3 · 5,7           |
| `border`                                         | `#3f2319` | Color/Border         | divisórias e contorno de card    | decorativo          |
| `border-soft`                                    | `#55321f` | Color/Border Soft    | trilho do slider, contorno suave | decorativo          |
| `input`                                          | `#8a6646` | novo                 | borda de campo, checkbox         | 3,7 · 3,4           |
| `ring`                                           | `#e89b55` | Text/Accent          | anel de foco                     | 8,5 · 7,7           |

### Ajustes de contraste

| Par            | No Figma                               | Ficou                | Por quê                                                  |
| -------------- | -------------------------------------- | -------------------- | -------------------------------------------------------- |
| Texto de erro  | `#ed1b2e`: 4,4 na página e 4,0 no card | `#ff5a5f`: 6,3 e 5,7 | o vermelho do Figma não passa AA em texto                |
| Borda de campo | `#3f2319`: 1,3 na página               | `#8a6646`: 3,7       | campo precisa de 3:1 para ser identificado (WCAG 1.4.11) |

## Tipografia

Só Roboto Mono, servida por `@fontsource/roboto-mono` (latin, pesos 400, 500 e 700), com `font-display: swap` e preload do 400 e do 700. A entrelinha nunca fica abaixo de 1,25x a fonte, o que resolve os textos cortados do Figma ("Carteira principal", "Criar perfil de colecionador").

| Token             | Tamanho / entrelinha | Absorve no Figma                    | Uso                                              |
| ----------------- | -------------------- | ----------------------------------- | ------------------------------------------------ |
| `text-caption`    | 12 / 16              | 9, 10, 11, 12, 13                   | selos, legendas, contadores                      |
| `text-small`      | 14 / 20              | 13, 14                              | labels, itens de menu, links do footer           |
| `text-body`       | 15 / 24              | 15 (entrelinhas 15, 16, 20, 40, 45) | texto corrido, campos, botões                    |
| `text-body-lg`    | 16 / 24              | 16, 17                              | nome do NFT, abas, navegação                     |
| `text-title`      | 18 / 26              | 18, 19, 20, 21, 22                  | títulos de seção e de modal, preço em destaque   |
| `text-heading`    | 24 / 32              | 22, 23, 24, 26                      | título do detalhe, título de página, hero mobile |
| `text-display-sm` | 28 / 36              | 28, 32                              | "Diário da Cunhagem", hero em tablet             |
| `text-display`    | 43 / 56              | 43                                  | título do hero no desktop                        |

Pesos: `font-normal` 400, `font-medium` 500, `font-bold` 700. Caixa alta só onde é parte da marca (logotipo "KURIO"); botões e abas usam caixa normal.

## Espaçamento e grade

- Escala de 4 px (`--spacing: 0.25rem`): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Container: utility `page`, 1200 px de conteúdo centralizado e 24 px de gutter em todas as larguras.
- Padding padrão: 16 em cards; 24 em painéis, seções e modais; 12 a 16 nas laterais de campos e botões.

## Raios

| Token          | Valor | Uso                                                      |
| -------------- | ----- | -------------------------------------------------------- |
| `rounded-sm`   | 4     | campos, botões, chips retangulares, itens de menu        |
| `rounded-md`   | 8     | cards, painéis, modais, menus                            |
| `rounded-lg`   | 16    | imagens e mídia                                          |
| `rounded-full` | —     | avatares, badges, radio, botões do seletor de quantidade |

Os mesmos raios valem no desktop e no mobile. O mobile do Figma usava 10 a 40.

## Componentes

Um componente por função, usado nas duas larguras. Primitivos do shadcn em `src/shared/ui/components/ui`; componentes do sistema em `src/shared/ui`.

| Componente              | Regra                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Button                  | variantes `default`, `outline`, `ghost`, `link`, `secondary` e `destructive`; altura 44 (36 no `sm`); rótulo centralizado, sem caixa alta, peso 700    |
| Field                   | label sempre visível, dica, erro ligado ao campo por `aria-describedby`, `aria-invalid`, asterisco `coral` com texto "obrigatório" para leitor de tela |
| Input, Select, Textarea | Input e Select: altura 44; Textarea: altura mínima 112; borda `input`, raio `sm`, padding lateral 16                                                   |
| Checkbox, RadioCard     | substituem o radio sozinho do Figma ("Usar outra carteira?", "Igual à carteira principal")                                                             |
| QuantityStepper         | um só para detalhe, carrinho desktop e mobile; botões redondos de 44                                                                                   |
| NftCard                 | mídia quadrada com raio `lg` e o mesmo respiro nos quatro lados; preço antigo riscado com texto para leitor de tela                                    |
| SectionHeading          | nível 1 (seção de página) e nível 2 (bloco dentro de painel)                                                                                           |
| Skeleton                | utility `shimmer`; sem animação com `prefers-reduced-motion`                                                                                           |

## Ícones

Só `lucide-react`. As letras usadas como ícone no Figma ("W", "C", "D", "M") viram ícones. Marcas de carteira aparecem com ícone genérico de carteira e o nome escrito.

## Foco

Anel de 2 px na cor `ring` com 2 px de afastamento, em todo elemento focável por teclado. Campos usam borda `ring` mais anel suave.
