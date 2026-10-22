let ready: Promise<void> = Promise.resolve()

export function holdNetworkUntil(promise: Promise<unknown>): void {
  ready = promise.then(
    () => undefined,
    () => undefined,
  )
}

export function whenNetworkReady(): Promise<void> {
  return ready
}
