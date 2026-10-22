# Contratos REST

A API é simulada pelo MSW, mas segue um contrato fixo: cada corpo de requisição e de resposta tem um schema Zod em `src/shared/contracts`, usado pela app (no Axios, antes de chegar ao cache) e pelos handlers (antes de responder). Se o mock e a app divergirem, o parse falha.

## Convenções

| Item                  | Regra                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| Base                  | `/api` na mesma origem (`VITE_API_BASE_URL` troca)                                     |
| Valores em ETH        | string decimal com ponto e até 18 casas (`"1.19"`, `"0.016"`); nunca número            |
| Quantidade            | inteiro a partir de 1                                                                  |
| Datas                 | ISO 8601 com fuso (`2026-10-21T15:00:00.000Z`)                                         |
| Sessão                | `Authorization: Bearer <token>`; o token dura 2 h                                      |
| Carrinho do visitante | `X-Cart-Id: <uuid>` gerado pela app e guardado no `localStorage`                       |
| Idempotência          | `Idempotency-Key: <chave>` obrigatório em `POST /orders`                               |
| Versão                | NFTs e pedidos têm `version` inteira que só cresce; os eventos carregam a mesma versão |

## Envelope de erro

Toda resposta HTTP de erro segue o mesmo formato:

```json
{ "error": { "code": "out_of_stock", "message": "Esta edição esgotou.", "fields": {}, "details": {} } }
```

`fields` liga o erro ao campo do formulário (mesma chave do corpo). `details` traz dados para a interface reagir, como a cotação nova num 409. Falhas de rede e timeout não têm corpo HTTP; o Axios as converte em `ApiError` com `kind` `network` ou `timeout`.

| Status | `code`                              | Quando                                                                                                                              |
| ------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 400    | `bad_request`                       | parâmetro de busca inválido, cabeçalho obrigatório ausente                                                                          |
| 401    | `unauthenticated`                   | sem token ou token desconhecido                                                                                                     |
| 401    | `session_expired`                   | token vencido; a app guarda o contexto e manda para o login                                                                         |
| 401    | `invalid_credentials`               | e-mail ou senha incorretos no login (não dispara o fluxo de sessão expirada)                                                        |
| 403    | `forbidden`                         | sem permissão (cenário `forbidden`)                                                                                                 |
| 404    | `not_found`                         | recurso inexistente ou de outro usuário                                                                                             |
| 409    | `out_of_stock`                      | edição esgotada ou estoque menor que o pedido                                                                                       |
| 409    | `quantity_limit`                    | passou do limite por pedido da edição (`details.max`)                                                                               |
| 409    | `quote_outdated`                    | preço, disponibilidade, cupom ou taxa mudaram desde a revisão (`details.quote`)                                                     |
| 409    | `quote_expired`                     | cotação vencida (`details.quote`)                                                                                                   |
| 409    | `account_conflict`                  | e-mail, usuário ou papel de carteira já em uso (`fields`)                                                                           |
| 409    | `idempotency_conflict`              | mesma `Idempotency-Key` com corpo diferente                                                                                         |
| 409    | `wallet_refused`                    | o provedor recusou a conexão da carteira                                                                                            |
| 422    | `validation_error`                  | corpo inválido (`fields`)                                                                                                           |
| 422    | `coupon_invalid` / `coupon_expired` | cupom inexistente ou vencido (`fields.code`)                                                                                        |
| 503    | `service_unavailable`               | falha transitória; consultas e criação de pedido podem repetir até 2 vezes; outras operações de escrita não repetem automaticamente |

O contrato compartilhado também admite `edition_unavailable`, `price_changed` e `internal_error`, mas nenhum handler atual retorna esses valores como erro HTTP.

O Axios converte tudo isso em `ApiError` com `kind` (`http`, `network`, `timeout`, `canceled`, `invalid_response`), `status`, `code`, `fields` e `details`.

## Sessão e conta

| Método e caminho      | Corpo                           | Resposta                         | Erros                          |
| --------------------- | ------------------------------- | -------------------------------- | ------------------------------ |
| `POST /auth/register` | `{ username, email, password }` | 201 `{ token, expiresAt, user }` | 409 `account_conflict`, 422    |
| `POST /auth/login`    | `{ email, password }`           | 200 `{ token, expiresAt, user }` | 401 `invalid_credentials`, 422 |
| `GET /auth/session`   | —                               | `{ expiresAt, user }`            | 401                            |
| `POST /auth/logout`   | —                               | 204                              | —                              |

`user` é `{ id, username, displayName, email, avatarUrl }`. Senha: 8 a 64 caracteres, com minúscula, maiúscula e número. Usuário: 3 a 20 caracteres em `[a-z0-9_.]`.

## NFTs

| Método e caminho     | Parâmetros                                                                                                                                                                                   | Resposta                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `GET /nfts`          | `q`, `collection`, `network`, `minPrice`, `maxPrice`, `tab` (`all`, `new`, `trending`), `sort` (`recent`, `price_asc`, `price_desc`, `name_asc`, `name_desc`), `page`, `pageSize` (padrão 9) | `{ items, page, pageSize, total, totalPages, priceRange: { min, max } }` |
| `GET /nfts/featured` | —                                                                                                                                                                                            | `{ hero: NftSummary[], spotlight: NftSummary \| null }`                  |
| `GET /nfts/:id`      | —                                                                                                                                                                                            | `NftDetail` ou 404                                                       |
| `GET /collections`   | —                                                                                                                                                                                            | `{ items: [{ id, name, count }] }` em ordem alfabética                   |
| `GET /networks`      | —                                                                                                                                                                                            | `{ items: [{ id, name, count }] }`                                       |

Os filtros combinam (E). `q` ignora maiúsculas e acentos e procura em nome, coleção, criador e atributos. Preço é comparado em wei. Empate na ordenação cai para o `id`, então a ordem é estável. `priceRange` é do catálogo inteiro, para os limites do filtro de preço.

`NftSummary`: `id`, `name`, `tokenId`, `collection { id, name }`, `network`, `image { src, alt }`, `price` (menor preço entre as edições disponíveis; se todas estiverem esgotadas, menor preço entre todas), `previousPrice`, `badge` (`rare`, `new` ou nulo), `availability`, `listedAt`, `version`.

`NftDetail` acrescenta `description`, `story[]`, `creator`, `contractAddress`, `royaltiesBps`, `attributes[]`, `rating { average, count }`, `reviews[]` e `editions[]` com `{ id, label, supply, available, price, maxPerOrder, status }`. `supply` e `available` nulos indicam edição aberta.

## Favoritos (sessão obrigatória)

| Método e caminho           | Resposta                                         |
| -------------------------- | ------------------------------------------------ |
| `GET /favorites`           | `{ items: NftSummary[] }`, mais recente primeiro |
| `PUT /favorites/:nftId`    | `{ nftId, favorited: true }`; idempotente        |
| `DELETE /favorites/:nftId` | `{ nftId, favorited: false }`; idempotente       |

## Carrinho

Logado, o carrinho é do usuário. Visitante, é o do `X-Cart-Id`. Com token vencido ou inválido, o carrinho responde 401 em vez de cair no carrinho de visitante. Toda resposta devolve o carrinho inteiro.

| Método e caminho            | Corpo                                                           | Erros                                         |
| --------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `GET /cart`                 | —                                                               | 400 sem `X-Cart-Id` para visitante            |
| `POST /cart/items`          | `{ nftId, editionId, quantity }` (soma à linha da mesma edição) | 404, 409 `out_of_stock`, 409 `quantity_limit` |
| `PATCH /cart/items/:id`     | `{ quantity }`                                                  | 404, 409                                      |
| `DELETE /cart/items/:id`    | —                                                               | 404                                           |
| `PUT /cart/coupon`          | `{ code }` (maiúsculas)                                         | 422 `coupon_invalid`, 422 `coupon_expired`    |
| `DELETE /cart/coupon`       | —                                                               | —                                             |
| `POST /cart/merge` (sessão) | `{ guestCartId }`                                               | resposta `{ cart, adjustments[] }`            |

`Cart`: `{ id, items[], coupon, itemCount, subtotal, version }`. Cada item traz `unitPrice` e `lineTotal` com o preço atual, `maxQuantity` (menor entre o limite por pedido e o estoque) e `status` (`available`, `limited`, `sold_out`).

O merge soma as quantidades da mesma edição, respeita o limite e descarta o que esgotou. Cada corte vem em `adjustments` com `{ nftId, editionId, name, requested, applied, reason }`, para a interface avisar.

## Cotação

| Método e caminho | Corpo         | Resposta |
| ---------------- | ------------- | -------- |
| `POST /quotes`   | `{ network }` | `Quote`  |

`Quote`: `{ id, version, cartVersion, network, lines[], coupon, subtotal, discount, networkFee, total, issues[], createdAt, expiresAt }`. A cotação vale 10 minutos.

- O desconto é calculado em pontos-base sobre o subtotal.
- A taxa de rede é fixa por rede: Ethereum 0.016, Polygon 0.002, Solana 0.001.
- `issues` pode conter `out_of_stock`, `quantity_limit` e `coupon_expired`. Só falta de estoque e excesso do limite bloqueiam a compra; um cupom expirado é descartado e a compra pode continuar sem o desconto. O schema também aceita `price_changed`, mas o cálculo atual da cotação não emite esse issue; mudanças de preço são detectadas ao comparar cotações.

## Pedidos (sessão obrigatória)

| Método e caminho                   | Corpo                                             | Resposta                                               |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| `POST /orders` + `Idempotency-Key` | `{ quoteId, walletId, network, provider, buyer }` | 201 pedido novo; 200 o mesmo pedido em reenvio         |
| `GET /orders/:id`                  | —                                                 | `Order` ou 404 (pedido de outro usuário também dá 404) |
| `GET /orders?status=pending`       | —                                                 | `{ items: Order[] }`                                   |

`buyer`: `{ displayName, username, email, referralCode, note }`.

Ao criar, o servidor:

1. Procura a chave. Mesma chave com o mesmo corpo devolve o pedido existente; com corpo diferente, 409 `idempotency_conflict`.
2. Confere se a carteira é do usuário e se a rede bate com ela.
3. Gera uma cotação nova e compara com a enviada. Se preço, disponibilidade, cupom ou taxa mudaram, responde 409 (`quote_outdated`, `quote_expired` ou `out_of_stock`) com a cotação nova em `details.quote`. A app mostra o que mudou e pede nova confirmação.
4. Cria o pedido `pending` com o **recibo** copiado da cotação. Mudanças posteriores no catálogo não alteram o recibo.

Em 3 s o pedido vira `confirmed` (com `transactionRef` simulada de 32 bytes) ou `refused` (com `reason`). A mudança sai pelo REST e pelo evento `order.updated`. Na confirmação, o servidor baixa o estoque e tira do carrinho só os itens e quantidades comprados. Na recusa, o carrinho fica como estava.

`Order`: `{ id, status, reason, transactionRef, network, provider, wallet { id, nickname, address }, buyer, receipt { lines, coupon, subtotal, discount, networkFee, total }, quoteId, createdAt, updatedAt, version }`.

## Perfil e carteiras (sessão obrigatória)

| Método e caminho                 | Corpo                                                     | Erros                                                    |
| -------------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `GET /profile`                   | —                                                         | 403 no cenário `forbidden`                               |
| `PATCH /profile`                 | `{ displayName, username, email, ensName }`               | 409 `account_conflict`, 422                              |
| `PUT /profile/avatar`            | `{ dataUrl }` (PNG, JPEG ou WebP até 1 MB; `null` remove) | 422                                                      |
| `POST /profile/password`         | `{ currentPassword, newPassword }`                        | 422 com `fields.currentPassword` ou `fields.newPassword` |
| `GET /wallets`                   | —                                                         | —                                                        |
| `POST /wallets`                  | `{ role, nickname, network, address, type, ensName }`     | 409 se o papel já existe, 422                            |
| `PATCH /wallets/:id`             | mesmo corpo                                               | 404, 409, 422                                            |
| `POST /wallets/:id/connection`   | `{ provider }`                                            | 409 `wallet_refused`                                     |
| `DELETE /wallets/:id/connection` | —                                                         | 404                                                      |

O endereço é validado pela rede: Ethereum e Polygon usam `0x` e 40 caracteres hexadecimais; Solana usa 32 a 44 caracteres em base58. O `role` é `primary` ou `secondary`, um de cada por usuário. O `type` é `metamask`, `walletconnect` ou `coinbase`.
