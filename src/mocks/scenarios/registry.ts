export const scenarioIds = [
  'default',
  'empty-catalog',
  'slow',
  'variable-latency',
  'out-of-order',
  'offline',
  'server-error',
  'bad-request',
  'session-expired',
  'forbidden',
  'register-conflict',
  'favorite-failure',
  'price-change-at-checkout',
  'sold-out-at-checkout',
  'order-timeout',
  'payment-confirmed',
  'payment-refused',
  'wallet-refused',
] as const

export type ScenarioId = (typeof scenarioIds)[number]

export interface Scenario {
  id: ScenarioId
  label: string
  description: string
}

export const scenarios: Record<ScenarioId, Scenario> = {
  default: {
    id: 'default',
    label: 'Padrão',
    description: 'Tudo responde em até 300 ms e o pagamento é confirmado em 3 s.',
  },
  'empty-catalog': {
    id: 'empty-catalog',
    label: 'Catálogo vazio',
    description: 'A listagem de NFTs e os destaques voltam sem itens.',
  },
  slow: {
    id: 'slow',
    label: 'Lentidão fixa',
    description: 'Toda chamada da API demora 2,5 s.',
  },
  'variable-latency': {
    id: 'variable-latency',
    label: 'Latência variável',
    description: 'Cada chamada demora entre 0,2 s e 1,8 s, numa sequência fixa e reproduzível.',
  },
  'out-of-order': {
    id: 'out-of-order',
    label: 'Respostas fora de ordem',
    description:
      'Consultas ímpares do catálogo demoram 1,5 s e as pares 0,2 s; a resposta antiga chega depois da nova.',
  },
  offline: {
    id: 'offline',
    label: 'Sem conexão',
    description: 'Toda chamada da API falha na rede e o Socket.IO recusa a conexão.',
  },
  'server-error': {
    id: 'server-error',
    label: 'Erro 503',
    description: 'Catálogo, destaques e detalhe respondem 503 (falha transitória).',
  },
  'bad-request': {
    id: 'bad-request',
    label: 'Erro 400',
    description: 'A listagem de NFTs responde 400 com o envelope de erro.',
  },
  'session-expired': {
    id: 'session-expired',
    label: 'Sessão expirada',
    description: 'Toda chamada autenticada responde 401 de sessão expirada.',
  },
  forbidden: {
    id: 'forbidden',
    label: 'Sem permissão',
    description: 'Perfil, carteiras e pedidos respondem 403.',
  },
  'register-conflict': {
    id: 'register-conflict',
    label: 'Conflito de cadastro',
    description: 'O cadastro responde 409: e-mail ou usuário já em uso.',
  },
  'favorite-failure': {
    id: 'favorite-failure',
    label: 'Falha de favorito',
    description: 'Favoritar e desfavoritar respondem 503 depois de 0,8 s.',
  },
  'price-change-at-checkout': {
    id: 'price-change-at-checkout',
    label: 'Preço muda na compra',
    description:
      'Ao enviar o pedido, o preço do primeiro item sobe 10% e o pedido volta 409 com a cotação nova.',
  },
  'sold-out-at-checkout': {
    id: 'sold-out-at-checkout',
    label: 'Edição esgota na compra',
    description: 'Ao enviar o pedido, a edição do primeiro item esgota e o pedido volta 409.',
  },
  'order-timeout': {
    id: 'order-timeout',
    label: 'Timeout depois de criar o pedido',
    description:
      'O primeiro envio cria o pedido mas a resposta não chega antes do timeout; o reenvio com a mesma chave recupera o mesmo pedido.',
  },
  'payment-confirmed': {
    id: 'payment-confirmed',
    label: 'Pagamento confirmado',
    description: 'O pedido fica pendente por 3 s e é confirmado.',
  },
  'payment-refused': {
    id: 'payment-refused',
    label: 'Pagamento recusado',
    description: 'O pedido fica pendente por 3 s e é recusado por saldo insuficiente.',
  },
  'wallet-refused': {
    id: 'wallet-refused',
    label: 'Carteira recusa a conexão',
    description: 'A conexão simulada com o provedor da carteira é recusada.',
  },
}

export function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === 'string' && (scenarioIds as readonly string[]).includes(value)
}
