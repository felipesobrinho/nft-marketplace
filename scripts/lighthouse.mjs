import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const profiles = [
  { id: 'mobile', label: 'Mobile', flags: '' },
  { id: 'desktop', label: 'Desktop', flags: '--collect.settings.preset=desktop' },
]
const categories = [
  ['performance', 'Performance', 90],
  ['accessibility', 'Accessibility', 95],
  ['best-practices', 'Best Practices', 95],
  ['seo', 'SEO', 90],
]
const metrics = [
  ['largest-contentful-paint', 'LCP', (value) => `${(value / 1000).toFixed(2)} s`],
  ['cumulative-layout-shift', 'CLS', (value) => value.toFixed(3)],
  ['total-blocking-time', 'TBT', (value) => `${Math.round(value)} ms`],
]
const pageNames = {
  '/': 'Início',
  '/nft/nft-0042': 'Detalhe (Emerald Ape #042)',
}

const run = (command, env = {}) =>
  execSync(command, { stdio: 'inherit', env: { ...process.env, ...env }, shell: true })

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const chromePath = process.env.CHROME_PATH || chromium.executablePath()
const skipBuild = process.argv.includes('--skip-build')
if (!skipBuild) run('npm run build:demo')

const results = []
let environment = null
for (const profile of profiles) {
  const outputDir = join('lighthouse', profile.id)
  rmSync('.lighthouseci', { recursive: true, force: true })
  rmSync(outputDir, { recursive: true, force: true })
  mkdirSync(outputDir, { recursive: true })
  run(`lhci collect --config=lighthouserc.json ${profile.flags}`, { CHROME_PATH: chromePath })
  run(`lhci upload --target=filesystem --outputDir=${outputDir}`)
  const manifest = JSON.parse(readFileSync(join(outputDir, 'manifest.json'), 'utf8'))
  const byUrl = new Map()
  for (const entry of manifest) {
    const report = JSON.parse(readFileSync(entry.jsonPath, 'utf8'))
    environment ??= {
      lighthouse: report.lighthouseVersion,
      userAgent: report.environment?.hostUserAgent ?? '',
      benchmarkIndex: report.environment?.benchmarkIndex,
    }
    const path = new URL(entry.url).pathname
    const list = byUrl.get(path) ?? []
    list.push({ report, htmlPath: entry.htmlPath, representative: entry.isRepresentativeRun })
    byUrl.set(path, list)
  }
  for (const [path, runs] of byUrl) {
    const row = {
      profile: profile.label,
      page: pageNames[path] ?? path,
      runs: runs.length,
      scores: {},
      metrics: {},
    }
    for (const [id] of categories) {
      row.scores[id] = Math.round(median(runs.map((item) => (item.report.categories[id]?.score ?? 0) * 100)))
    }
    for (const [id] of metrics) {
      row.metrics[id] = median(runs.map((item) => item.report.audits[id]?.numericValue ?? 0))
    }
    row.htmlPath = runs.find((item) => item.representative)?.htmlPath ?? runs[0]?.htmlPath
    results.push(row)
  }
}
rmSync('.lighthouseci', { recursive: true, force: true })

const lhciVersion = JSON.parse(readFileSync('node_modules/@lhci/cli/package.json', 'utf8')).version
const date = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
const scoreCell = (value, goal) => (value >= goal ? `${value}` : `**${value}** (meta ${goal})`)
const lines = [
  '# Lighthouse',
  '',
  'Auditoria do início e do detalhe de um NFT fixo, nos perfis mobile e desktop, com o build de demonstração (`pnpm build:demo`), o cenário padrão dos mocks e três execuções por página e perfil. A tabela mostra a mediana.',
  '',
  '## Resultado',
  '',
  '| Perfil | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |',
  '|---|---|---|---|---|---|---|---|---|',
  ...results.map(
    (row) =>
      `| ${row.profile} | ${row.page} | ${categories.map(([id, , goal]) => scoreCell(row.scores[id], goal)).join(' | ')} | ${metrics.map(([id, , format]) => format(row.metrics[id])).join(' | ')} |`,
  ),
  '',
  'Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90. Valor abaixo da meta aparece em negrito.',
  '',
  '## Ambiente',
  '',
  '| Item | Valor |',
  '|---|---|',
  `| Data | ${date} |`,
  `| Lighthouse | ${environment?.lighthouse ?? '?'} |`,
  `| @lhci/cli | ${lhciVersion} |`,
  `| Node.js | ${process.version} |`,
  `| Navegador | ${environment?.userAgent ?? '?'} |`,
  `| Índice de benchmark da máquina | ${environment?.benchmarkIndex ?? '?'} |`,
  `| Sistema | ${process.platform} ${process.arch} |`,
  '',
  '## Condições',
  '',
  '- Build `pnpm build:demo` servido por `vite preview` em `http://localhost:4173`, com o MSW ligado e o cenário padrão.',
  '- Mobile: emulação padrão do Lighthouse (tela de celular, CPU 4x mais lenta e rede 4G simulada).',
  '- Desktop: preset `desktop` do Lighthouse (sem limitação de CPU e rede rápida).',
  '- Três execuções por página e perfil; configuração em `lighthouserc.json`; comando `pnpm lighthouse`.',
  '- Relatórios HTML e JSON de cada execução em `lighthouse/mobile` e `lighthouse/desktop`.',
  '',
]
const extra = existsSync('docs/lighthouse-analise.md')
  ? readFileSync('docs/lighthouse-analise.md', 'utf8')
  : ''
writeFileSync('docs/lighthouse.md', lines.join('\n') + (extra ? `\n${extra}` : ''))
console.log(results.map((row) => `${row.profile} ${row.page}: ${JSON.stringify(row.scores)}`).join('\n'))
