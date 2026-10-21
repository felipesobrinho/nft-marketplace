const PREFIX = 'kurio:'

function store(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readJson<T>(key: string, kind: 'local' | 'session' = 'local'): T | null {
  try {
    const raw = store(kind)?.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown, kind: 'local' | 'session' = 'local'): void {
  try {
    store(kind)?.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    return
  }
}

export function removeKey(key: string, kind: 'local' | 'session' = 'local'): void {
  try {
    store(kind)?.removeItem(PREFIX + key)
  } catch {
    return
  }
}

export function removeKeysWithPrefix(
  prefix: string,
  kind: 'local' | 'session' = 'local',
  keep?: string,
): void {
  const target = store(kind)
  if (!target) return
  const keys: string[] = []
  for (let index = 0; index < target.length; index += 1) {
    const key = target.key(index)
    if (key?.startsWith(PREFIX + prefix) && (keep === undefined || key !== PREFIX + keep)) keys.push(key)
  }
  keys.forEach((key) => target.removeItem(key))
}
