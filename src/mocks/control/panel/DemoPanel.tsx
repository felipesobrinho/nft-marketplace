import { useEffect, useRef, useState } from 'react'
import {
  connections,
  disconnect,
  getScenarios,
  listNfts,
  type NftItemSummary,
  replay,
  reset,
  type ScenarioSummary,
  setScenario,
  settlePending,
  updateNft,
} from './control'

export function DemoPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([])
  const [currentScenario, setCurrentScenario] = useState('')
  const [selectedScenario, setSelectedScenario] = useState('')
  const [openConnections, setOpenConnections] = useState(0)
  const [nfts, setNfts] = useState<NftItemSummary[]>([])
  const [selectedNftId, setSelectedNftId] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    void getScenarios()
      .then((res) => {
        if (!mounted) return
        setScenarios(res.available)
        setCurrentScenario(res.current)
        setSelectedScenario(res.current)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setStatusMessage(err instanceof Error ? err.message : 'Falha ao carregar cenários.')
      })
    void listNfts()
      .then((res) => {
        if (!mounted) return
        setNfts(res.items)
        const first = res.items[0]
        if (first) {
          setSelectedNftId(first.id)
        }
      })
      .catch(() => {
        if (!mounted) return
        setNfts([])
      })
    return () => {
      mounted = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let active = true
    function poll() {
      void connections()
        .then((res) => {
          if (active) setOpenConnections(res.connections)
        })
        .catch(() => {
          if (active) setOpenConnections(0)
        })
    }
    poll()
    const interval = setInterval(poll, 2000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const selectedDesc = scenarios.find((s) => s.id === selectedScenario)?.description ?? ''

  async function handleApplyScenario() {
    try {
      await setScenario(selectedScenario)
      window.location.reload()
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : 'Falha ao aplicar cenário.')
    }
  }

  async function handleResetData() {
    try {
      await reset(currentScenario || undefined)
      window.location.reload()
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : 'Falha ao restaurar dados.')
    }
  }

  async function handlePriceChange() {
    if (!selectedNftId) {
      setStatusMessage('Selecione um NFT.')
      return
    }
    if (!/^\d+(\.\d{1,3})?$/.test(newPrice)) {
      setStatusMessage('Preço inválido. Use ponto e até 3 casas.')
      return
    }
    try {
      const res = await updateNft({ nftId: selectedNftId, price: newPrice })
      setStatusMessage(`Evento enviado a ${res.delivered} conexão.`)
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : 'Falha ao alterar preço.')
    }
  }

  async function handleSoldOut() {
    if (!selectedNftId) {
      setStatusMessage('Selecione um NFT.')
      return
    }
    try {
      const res = await updateNft({ nftId: selectedNftId, available: 0 })
      setStatusMessage(`Evento enviado a ${res.delivered} conexão.`)
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : 'Falha ao esgotar NFT.')
    }
  }

  async function handleDisconnect() {
    try {
      const res = await disconnect()
      setStatusMessage(`Conexões encerradas: ${res.closed}.`)
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : 'Falha ao derrubar conexão.')
    }
  }

  async function handleReplayDuplicate() {
    try {
      const res = await replay('duplicate')
      setStatusMessage(`Evento enviado a ${res.delivered} conexão.`)
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : 'Falha ao repetir evento.')
    }
  }

  async function handleReplayStale() {
    try {
      const res = await replay('stale')
      setStatusMessage(`Evento enviado a ${res.delivered} conexão.`)
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : 'Falha ao enviar evento antigo.')
    }
  }

  async function handleSettlePending() {
    try {
      const res = await settlePending()
      setStatusMessage(`Pedidos liquidados: ${res.settled}.`)
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : 'Falha ao liquidar pedidos.')
    }
  }

  return (
    <div className="fixed z-50 bottom-24 left-4 md:bottom-4 flex flex-col items-start gap-2">
      {isOpen && (
        <section
          id="painel-demo-conteudo"
          aria-labelledby="painel-demo-titulo"
          className="w-[min(22rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto bg-card border border-border rounded-md p-4 flex flex-col gap-4 text-foreground"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
            <h2 id="painel-demo-titulo" className="text-title font-bold text-foreground">
              Painel da demonstração
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                triggerRef.current?.focus()
              }}
              className="h-11 rounded-sm border border-primary text-highlight px-3 text-small font-bold cursor-pointer hover:bg-primary/10 transition-colors"
            >
              Fechar
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-body font-bold text-foreground">Cenário</h3>
            <label htmlFor="cenario-ativo" className="text-small font-medium text-foreground">
              Cenário ativo
            </label>
            <select
              id="cenario-ativo"
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="h-11 w-full rounded-sm border border-input bg-card px-4 text-body text-foreground outline-none"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.label}
                </option>
              ))}
            </select>
            {selectedDesc && <p className="text-caption text-muted-foreground">{selectedDesc}</p>}
            <button
              type="button"
              onClick={() => void handleApplyScenario()}
              className="h-11 rounded-sm bg-primary text-primary-foreground px-4 text-small font-bold cursor-pointer hover:bg-primary/90 transition-colors"
            >
              Aplicar e recarregar
            </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <h3 className="text-body font-bold text-foreground">Dados</h3>
            <button
              type="button"
              onClick={() => void handleResetData()}
              className="h-11 rounded-sm border border-primary text-highlight px-3 text-small font-bold cursor-pointer hover:bg-primary/10 transition-colors"
            >
              Restaurar dados iniciais
            </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <h3 className="text-body font-bold text-foreground">Tempo real</h3>
            <p className="text-caption text-muted-foreground">Conexões abertas: {openConnections}</p>
            <label htmlFor="nft-select" className="text-small font-medium text-foreground">
              NFT
            </label>
            <select
              id="nft-select"
              value={selectedNftId}
              onChange={(e) => setSelectedNftId(e.target.value)}
              className="h-11 w-full rounded-sm border border-input bg-card px-4 text-body text-foreground outline-none"
            >
              {nfts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.price} ETH)
                </option>
              ))}
            </select>
            <label htmlFor="novo-preco" className="text-small font-medium text-foreground">
              Novo preço (ETH)
            </label>
            <input
              id="novo-preco"
              type="text"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0.5"
              className="h-11 w-full rounded-sm border border-input bg-transparent px-4 text-body text-foreground placeholder:text-subtle outline-none"
            />
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => void handlePriceChange()}
                className="h-11 rounded-sm border border-primary text-highlight px-3 text-small font-bold cursor-pointer hover:bg-primary/10 transition-colors"
              >
                Mudar preço
              </button>
              <button
                type="button"
                onClick={() => void handleSoldOut()}
                className="h-11 rounded-sm border border-primary text-highlight px-3 text-small font-bold cursor-pointer hover:bg-primary/10 transition-colors"
              >
                Esgotar NFT
              </button>
              <button
                type="button"
                onClick={() => void handleDisconnect()}
                className="h-11 rounded-sm border border-primary text-highlight px-3 text-small font-bold cursor-pointer hover:bg-primary/10 transition-colors"
              >
                Derrubar conexão
              </button>
              <button
                type="button"
                onClick={() => void handleReplayDuplicate()}
                className="h-11 rounded-sm border border-primary text-highlight px-3 text-small font-bold cursor-pointer hover:bg-primary/10 transition-colors"
              >
                Repetir último evento
              </button>
              <button
                type="button"
                onClick={() => void handleReplayStale()}
                className="h-11 rounded-sm border border-primary text-highlight px-3 text-small font-bold cursor-pointer hover:bg-primary/10 transition-colors"
              >
                Enviar evento antigo
              </button>
              <button
                type="button"
                onClick={() => void handleSettlePending()}
                className="h-11 rounded-sm border border-primary text-highlight px-3 text-small font-bold cursor-pointer hover:bg-primary/10 transition-colors"
              >
                Liquidar pedidos pendentes
              </button>
            </div>
          </div>

          <div role="status" aria-live="polite" className="min-h-5 text-caption text-highlight">
            {statusMessage}
          </div>
        </section>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="painel-demo-conteudo"
        className="rounded-full bg-surface-raised border border-primary px-4 h-11 text-small font-bold text-highlight cursor-pointer"
      >
        Demonstração
      </button>
    </div>
  )
}
