# Eventos em tempo real

O tempo real usa Socket.IO de verdade no cliente (`socket.io-client`) e um servidor simulado pelo MSW na própria página. Nada chama setter, callback ou cache direto: todo evento sai do banco simulado, passa pelo protocolo Socket.IO e chega pelo socket.

## Transporte

| Item              | Valor                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Cliente           | `socket.io-client` 4.8, `transports: ['websocket']`, `autoConnect: false`, `auth: { token }` |
| Caminho           | `/realtime/` na mesma origem da página (`VITE_SOCKET_URL` troca a origem)                    |
| Servidor simulado | `ws.link` do MSW 2.15 com `@mswjs/socket.io-binding` 0.2                                     |
| Reconexão         | automática do Socket.IO, de 0,5 s a 4 s entre tentativas                                     |
| Quando conecta    | depois da primeira pintura e só depois que o worker do MSW está pronto                       |

### Por que o caminho é `/realtime/` e não `/socket.io/`

O MSW remove o prefixo `/socket.io/` da URL antes de comparar com o handler. Com o caminho padrão, o handler só casaria com a raiz da origem, que também é onde o Vite abre o WebSocket do HMR em desenvolvimento. Um caminho próprio separa os dois.

### Por que o cliente Socket.IO carrega depois do MSW

O `engine.io-client` guarda o construtor `WebSocket` no momento em que o módulo é avaliado. Se ele carregasse junto com o bundle principal, guardaria o `WebSocket` nativo antes de o MSW instalar a interceptação, e a conexão iria para a rede. Por isso `shared/infrastructure/realtime.ts` importa `socket.io-client` de forma dinâmica, depois que o worker está pronto. De quebra, o Socket.IO sai do bundle inicial.

## Envelope

Todo evento tem o mesmo formato, validado com Zod (`shared/contracts/events.ts`) antes de chegar à interface.

```json
{
  "eventId": "8f1c…",
  "type": "nft.updated",
  "resource": { "type": "nft", "id": "nft-0042" },
  "version": 2,
  "occurredAt": "2026-10-21T15:00:00.000Z",
  "userId": "user-ana",
  "data": {}
}
```

- `eventId`: identidade estável; o cliente descarta um `eventId` que já viu.
- `resource` e `version`: o cliente guarda a maior versão conhecida de cada recurso, vinda do REST ou de eventos, e descarta evento com versão menor ou igual.
- `userId`: só em eventos privados. O servidor simulado entrega o evento apenas às conexões daquele usuário, e o cliente ainda descarta evento de outro usuário.

## Eventos

| Evento          | Recurso | `data`                                                                                                   | Efeito                                                                                                    |
| --------------- | ------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `nft.updated`   | `nft`   | `name`, `price`, `previousPrice`, `availability`, `editions[]` com `id`, `price`, `available` e `status` | atualiza preço e disponibilidade no catálogo, detalhe e carrinho; anuncia a mudança na região `aria-live` |
| `order.updated` | `order` | `status` (`pending`, `confirmed`, `refused`), `reason`, `transactionRef`                                 | atualiza o pedido e mostra confirmação ou recusa                                                          |

## Na interface

Cada módulo cuida do próprio cache; `src/app/RealtimeSync.tsx` só monta os hooks. Todos assinam no `useEffect` e soltam o listener no retorno.

| Módulo    | `nft.updated`                                                                                                                                                    | Reconexão                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| catalog   | troca preço, preço anterior e disponibilidade nas listas e nos destaques, e marca as listas como desatualizadas para a próxima visita                            | invalida todo o catálogo    |
| nft       | troca preço, estoque e situação das edições no detalhe; a edição escolhida continua escolhida e, se esgotar, o botão vira "Edição esgotada"                      | invalida os detalhes        |
| favorites | troca preço e disponibilidade na lista de interesse                                                                                                              | invalida a lista            |
| cart      | se o NFT está no carrinho, reconsulta o carrinho e a cotação; a página do carrinho mostra qual edição mudou e quanto                                             | invalida carrinho e cotação |
| checkout  | a cotação nova chega pelo carrinho; se a revisão estiver aberta, aparece a lista do que mudou e o botão pede nova confirmação; edição esgotada bloqueia a compra | igual ao carrinho           |

| Módulo | `order.updated`                                                                                                        | Reconexão                      |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| orders | aplica `status`, `reason` e `transactionRef` no pedido aberto se a versão for maior, e reconsulta a lista de pendentes | invalida os pedidos do usuário |

As consultas REST de catálogo, detalhe e pedido registram a versão de cada recurso no filtro, então um evento com versão igual ou menor que a já vista na tela é descartado. A região `aria-live` (`NftUpdateAnnouncer`) anuncia a mudança de preço ou o esgotamento.

## Como disparar

Os endpoints de controle existem só no MSW. Toda mudança passa pelo banco simulado e sai pelo REST e pelo socket ao mesmo tempo.

| Endpoint                             | Corpo                                       | O que faz                                                                                       |
| ------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `POST /__mock/events/nft-updated`    | `{ nftId, price?, editionId?, available? }` | grava a mudança, aumenta a versão do NFT e emite `nft.updated`; responde `{ event, delivered }` |
| `POST /__mock/realtime/disconnect`   | `{}`                                        | derruba todas as conexões; o cliente reconecta sozinho                                          |
| `POST /__mock/events/order-updated`  | `{ orderId, status, reason? }`              | liquida o pedido pendente como `confirmed` ou `refused` e emite `order.updated`                 |
| `POST /__mock/events/replay`         | `{ type?, mode }` (`duplicate` ou `stale`)  | reenvia o último evento igual (`duplicate`) ou com versão menor e `eventId` novo (`stale`)      |
| `POST /__mock/orders/settle-pending` | `{}`                                        | liquida na hora todos os pedidos pendentes                                                      |
| `GET /__mock/realtime`               | —                                           | número de conexões abertas                                                                      |

## Limitações conhecidas

- O binding só fala o namespace padrão (`/`). Não há salas nem namespaces.
- Só eventos de texto (JSON). Nada binário.
- Sem ack: `emit` com callback não recebe resposta.
- Sem long-polling: o cliente usa só `websocket`.
- O handshake é simulado pelo binding, com `sid` fixo. O binding não envia ping; o servidor simulado envia um a cada 20 s para o cliente não derrubar a conexão por `pingTimeout`.
- O token do usuário vem no pacote CONNECT do cliente (`40{"token":…}`), lido pelo servidor simulado na mensagem bruta, porque o binding ignora pacotes que não são evento.
- O "servidor" mora na aba. Duas abas abertas são dois servidores, cada um com o seu banco em memória; o `localStorage` guarda o estado da última aba que ficou oculta.
