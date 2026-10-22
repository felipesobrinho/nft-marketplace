# Cenários e dados simulados

Os cenários mudam o comportamento da API simulada de forma determinística: a mesma sequência de ações produz o mesmo resultado em desenvolvimento, na demonstração publicada e nos testes.

## Como escolher

| Jeito  | Como                                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------------------- |
| URL    | abra qualquer tela com `?scenario=<id>`, por exemplo `/?scenario=slow`; o cenário fica guardado no `localStorage` |
| Painel | botão redondo de demonstração no canto inferior direito → "Cenário ativo" → "Aplicar e recarregar"                |
| API    | `PUT /__mock/scenario` com `{ "id": "<id>" }`                                                                     |

## Como restaurar

O botão "Restaurar dados iniciais" do painel ou o `POST /__mock/reset` (corpo opcional `{ "scenario": "<id>" }`) apagam o banco persistido e voltam ao seed completo. Eles também limpam o storage da app (sessão, carrinho do visitante e rascunhos) e voltam ao cenário pedido, ou ao padrão. Os testes E2E fazem isso antes de cada caso.

## Dados iniciais

| Item            | Valor                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFTs            | 54, em 6 páginas de 9, nas 9 categorias e nas 3 redes, com edições 1/1, 1/10, 1/50 e Aberta                                                             |
| Artes           | as 4 do Figma (`emerald-ape`, `violet-nomad`, `ivory-baron`, `golden-beat`), reaproveitadas com nomes diferentes                                        |
| Casos especiais | 2 NFTs esgotados, edições esgotadas ao lado de disponíveis, edições 1/1 com limite de 1, preços de 0.02 a 12.30 ETH                                     |
| Usuários        | `ana@jungle.test` (carteiras principal e secundária, 3 favoritos) e `bruno@jungle.test` (sem carteira), senha `Senha@123`, guardada só como hash bcrypt |
| Cupons          | `JUNGLE10` válido (10%), `VELHO20` expirado; qualquer outro é inválido                                                                                  |

## Cenários

| Id                         | Efeito                                                                                                 | Como reproduzir na interface                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `default`                  | respostas entre 80 e 300 ms; pagamento confirmado em 3 s                                               | uso normal                                                                      |
| `empty-catalog`            | listagem e destaques vazios                                                                            | abrir o início: estado vazio                                                    |
| `slow`                     | toda chamada demora 2,5 s                                                                              | abrir início, detalhe ou carrinho: skeletons com shimmer                        |
| `variable-latency`         | cada chamada demora entre 0,2 e 1,8 s, numa sequência fixa                                             | navegar entre filtros: indicador de atualização em segundo plano                |
| `out-of-order`             | consultas ímpares do catálogo demoram 1,5 s e as pares 0,2 s                                           | trocar dois filtros em seguida: a resposta antiga chega depois e é descartada   |
| `offline`                  | toda chamada falha na rede; o Socket.IO recusa a conexão                                               | abrir qualquer tela: erro de conexão com "Tentar de novo"                       |
| `server-error`             | catálogo, destaques, detalhe e facetas respondem 503                                                   | abrir o início: erro com nova tentativa; trocar para `default` e tentar de novo |
| `bad-request`              | a listagem responde 400                                                                                | abrir o início: mensagem do envelope de erro                                    |
| `session-expired`          | toda chamada autenticada responde 401 `session_expired`                                                | logado, abrir o perfil ou confirmar a compra: volta ao login e retoma depois    |
| `forbidden`                | perfil, carteiras e pedidos respondem 403                                                              | abrir o perfil logado: aviso de permissão                                       |
| `register-conflict`        | cadastro responde 409 no campo de e-mail neste cenário; conflitos normais também podem ser por usuário | criar conta: erro no campo de e-mail                                            |
| `favorite-failure`         | favoritar responde 503 depois de 0,8 s                                                                 | favoritar um NFT: o coração volta ao estado anterior e aparece o erro           |
| `price-change-at-checkout` | no envio do pedido, o preço do primeiro item sobe 10% uma vez                                          | confirmar a compra: a revisão mostra o preço novo e pede nova confirmação       |
| `sold-out-at-checkout`     | no envio do pedido, a edição do primeiro item esgota uma vez                                           | confirmar a compra: aviso de esgotado; o item fica marcado no carrinho          |
| `order-timeout`            | o primeiro envio cria o pedido mas só responde depois de 15 s                                          | confirmar a compra: a app reenvia com a mesma chave e recupera o mesmo pedido   |
| `payment-confirmed`        | igual ao padrão: pendente por 3 s e confirmado                                                         | concluir uma compra                                                             |
| `payment-refused`          | pendente por 3 s e recusado por saldo insuficiente                                                     | concluir uma compra: recusa com motivo; o carrinho continua igual               |
| `wallet-refused`           | a conexão com o provedor da carteira é recusada                                                        | escolher a carteira no pagamento e conectar                                     |

## Endpoints de controle

Existem só no MSW, para o painel e os testes. Toda mudança passa pelo banco simulado e sai pelo REST e pelo socket ao mesmo tempo.

| Endpoint                             | Corpo                                       | O que faz                                                                    |
| ------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------- |
| `POST /__mock/reset`                 | `{ scenario? }`                             | restaura o seed, limpa o storage da app e define o cenário                   |
| `GET /__mock/scenario`               | —                                           | cenário atual e lista de cenários                                            |
| `PUT /__mock/scenario`               | `{ id }`                                    | troca o cenário                                                              |
| `POST /__mock/events/nft-updated`    | `{ nftId, editionId?, price?, available? }` | muda preço ou estoque de uma edição e emite `nft.updated`                    |
| `POST /__mock/events/order-updated`  | `{ orderId, status, reason? }`              | confirma ou recusa um pedido pendente agora e emite `order.updated`          |
| `POST /__mock/events/replay`         | `{ type?, mode }`                           | reenvia o último evento igual (`duplicate`) ou com versão anterior (`stale`) |
| `POST /__mock/orders/settle-pending` | `{}`                                        | liquida agora todos os pedidos pendentes                                     |
| `GET /__mock/realtime`               | —                                           | conexões Socket.IO abertas                                                   |
| `POST /__mock/realtime/disconnect`   | `{}`                                        | derruba as conexões; o cliente reconecta sozinho                             |

## Persistência

O banco usa `@msw/data` com `persist()`, que grava no `localStorage` quando a página fica oculta (refresh, troca de aba, fechamento). Por isso favoritos, carrinho, perfil, carteiras e pedidos sobrevivem ao refresh. Um pedido pendente tem a hora de liquidação gravada e é reagendado quando a página volta, sem criar outra compra.

### Limitações

- O servidor simulado roda na aba. Duas abas abertas são dois servidores; vale o estado da última que ficou oculta.
- Fechar o navegador à força antes de a aba ficar oculta perde a última mudança.
- A latência simulada usa `setTimeout`, então o `page.clock` do Playwright controla tudo, inclusive a liquidação do pagamento.
