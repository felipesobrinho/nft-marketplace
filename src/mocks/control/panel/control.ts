export interface ScenarioSummary {
  id: string
  label: string
  description: string
}

export interface ScenarioResponse {
  current: string
  available: ScenarioSummary[]
}

export interface SetScenarioResponse {
  current: string
}

export interface ResetResponse {
  ok: boolean
  scenario: string
}

export interface NftUpdateParams {
  nftId: string
  editionId?: string
  price?: string
  available?: number
}

export interface NftUpdateResponse {
  delivered: number
}

export interface DisconnectResponse {
  closed: number
}

export interface ConnectionsResponse {
  connections: number
}

export interface ReplayResponse {
  delivered: number
}

export interface SettlePendingResponse {
  settled: number
}

export interface NftItemSummary {
  id: string
  name: string
  price: string
}

export interface ListNftsResponse {
  items: NftItemSummary[]
}

async function handleResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    let msg = fallbackMessage
    try {
      const data = (await res.json()) as { message?: string; error?: { message?: string } }
      if (data.message) {
        msg = data.message
      } else if (data.error?.message) {
        msg = data.error.message
      }
    } catch {
      msg = fallbackMessage
    }
    throw new Error(msg)
  }
  return (await res.json()) as T
}

export async function getScenarios(): Promise<ScenarioResponse> {
  const res = await fetch('/__mock/scenario')
  return handleResponse<ScenarioResponse>(res, 'Falha ao carregar cenários.')
}

export async function setScenario(id: string): Promise<SetScenarioResponse> {
  const res = await fetch('/__mock/scenario', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  return handleResponse<SetScenarioResponse>(res, 'Falha ao atualizar cenário.')
}

export async function reset(scenario?: string): Promise<ResetResponse> {
  const res = await fetch('/__mock/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  })
  return handleResponse<ResetResponse>(res, 'Falha ao restaurar dados.')
}

export async function updateNft(body: NftUpdateParams): Promise<NftUpdateResponse> {
  const res = await fetch('/__mock/events/nft-updated', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<NftUpdateResponse>(res, 'Falha ao disparar atualização do NFT.')
}

export async function disconnect(): Promise<DisconnectResponse> {
  const res = await fetch('/__mock/realtime/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  return handleResponse<DisconnectResponse>(res, 'Falha ao derrubar conexões.')
}

export async function connections(): Promise<ConnectionsResponse> {
  const res = await fetch('/__mock/realtime')
  return handleResponse<ConnectionsResponse>(res, 'Falha ao consultar conexões.')
}

export async function replay(mode: 'duplicate' | 'stale'): Promise<ReplayResponse> {
  const res = await fetch('/__mock/events/replay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  })
  return handleResponse<ReplayResponse>(res, 'Falha ao reenviar evento.')
}

export async function settlePending(): Promise<SettlePendingResponse> {
  const res = await fetch('/__mock/orders/settle-pending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  return handleResponse<SettlePendingResponse>(res, 'Falha ao liquidar pedidos pendentes.')
}

export async function listNfts(): Promise<ListNftsResponse> {
  const res = await fetch('/api/nfts?pageSize=48&sort=name_asc')
  return handleResponse<ListNftsResponse>(res, 'Falha ao listar NFTs.')
}
