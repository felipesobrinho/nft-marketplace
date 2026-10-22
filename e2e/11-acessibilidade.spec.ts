import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'
import { addToUserCart, authedCall } from './support/checkout'
import { call, resetMocks, waitForMocks } from './support/mock'
import { signInThroughApi } from './support/session'

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 1440) >= 768

interface Screen {
  name: string
  path: string | ((page: Page) => Promise<string>)
  signedIn?: boolean
  ready: (page: Page) => Promise<void>
}

async function createConfirmedOrder(page: Page): Promise<string> {
  await addToUserCart(page, [{ nftId: 'nft-0042', editionId: 'nft-0042-1-50', quantity: 1 }])
  const wallets = await authedCall<{ items: { id: string; network: string }[] }>(page, '/api/wallets')
  const wallet = wallets.body.items[0]
  if (!wallet) throw new Error('sem carteira')
  const quote = await authedCall<{ id: string }>(page, '/api/quotes', { body: { network: wallet.network } })
  const order = await authedCall<{ id: string }>(page, '/api/orders', {
    body: {
      quoteId: quote.body.id,
      walletId: wallet.id,
      network: wallet.network,
      provider: 'metamask',
      buyer: {
        displayName: 'Ana Lima',
        username: 'ana.lima',
        email: 'ana@jungle.test',
        referralCode: '',
        note: '',
      },
    },
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  await call(page, '/__mock/orders/settle-pending', { body: {} })
  return `/pedidos/${order.body.id}`
}

const heading = (name: string | RegExp) => async (page: Page) => {
  await expect(page.getByRole('heading', { name }).filter({ visible: true }).first()).toBeVisible()
}

const screens: Screen[] = [
  { name: 'início', path: '/', ready: heading(/Seja dono/) },
  { name: 'detalhe', path: '/nft/nft-0042', ready: heading('Emerald Ape #042') },
  { name: 'NFT inexistente', path: '/nft/nft-9999', ready: heading(/não encontrado/i) },
  {
    name: 'carrinho',
    path: async (page) => {
      await addToUserCart(page, [{ nftId: 'nft-0042', editionId: 'nft-0042-1-50', quantity: 2 }])
      return '/carrinho'
    },
    signedIn: true,
    ready: async (page) => {
      await expect(page.locator('[data-cart-line]').filter({ visible: true }).first()).toBeVisible()
    },
  },
  {
    name: 'login',
    path: '/entrar',
    ready: async (page) => {
      await expect(
        page.getByRole('button', { name: 'Entrar', exact: true }).filter({ visible: true }).first(),
      ).toBeVisible()
    },
  },
  {
    name: 'cadastro',
    path: '/cadastro',
    ready: async (page) => {
      await expect(
        page.getByRole('button', { name: 'Criar conta', exact: true }).filter({ visible: true }).first(),
      ).toBeVisible()
    },
  },
  {
    name: 'pagamento',
    path: async (page) => {
      await addToUserCart(page, [{ nftId: 'nft-0042', editionId: 'nft-0042-1-50', quantity: 2 }])
      return '/pagamento'
    },
    signedIn: true,
    ready: heading('Dados do colecionador'),
  },
  {
    name: 'recibo',
    path: createConfirmedOrder,
    signedIn: true,
    ready: heading('Seus NFTs agora estão na sua carteira'),
  },
  { name: 'perfil', path: '/conta/perfil', signedIn: true, ready: heading('Perfil do colecionador') },
  { name: 'carteiras', path: '/conta/carteiras', signedIn: true, ready: heading('Carteira principal') },
  {
    name: 'lista de interesse',
    path: '/conta/favoritos',
    signedIn: true,
    ready: heading('Lista de interesse'),
  },
]

async function open(page: Page, screen: Screen): Promise<void> {
  if (screen.signedIn) await signInThroughApi(page)
  const path = typeof screen.path === 'string' ? screen.path : await screen.path(page)
  await page.goto(path)
  await waitForMocks(page)
  await screen.ready(page)
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
})

for (const screen of screens) {
  test(`${screen.name}: sem violação séria do axe e sem rolagem horizontal`, async ({ page }) => {
    await open(page, screen)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    const serious = results.violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
      .map((violation) => ({
        id: violation.id,
        help: violation.help,
        targets: violation.nodes.slice(0, 5).map((node) => node.target.join(' ')),
      }))
    expect(serious).toEqual([])

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
    const widths = isDesktop(page) ? [768, 720] : [320]
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 })
      await page.waitForTimeout(150)
      expect(await horizontalOverflow(page), `rolagem horizontal em ${width} px`).toBeLessThanOrEqual(0)
    }
  })
}

test('o link "Pular para o conteúdo" é o primeiro foco e leva ao conteúdo', async ({ page }) => {
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#conteudo')).toBeFocused()
})

test('o foco do teclado aparece com contorno ou anel visível', async ({ page }) => {
  for (let step = 0; step < 4; step += 1) {
    await page.keyboard.press('Tab')
    const indicator = await page.evaluate(() => {
      const element = document.activeElement
      if (!element || element === document.body) return null
      const style = getComputedStyle(element)
      return {
        tag: element.tagName,
        outline: style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 2,
        ring: style.boxShadow !== 'none',
      }
    })
    expect(indicator, `foco no passo ${step + 1}`).not.toBeNull()
    expect(indicator?.outline || indicator?.ring, `indicador de foco em ${indicator?.tag ?? ''}`).toBe(true)
  }
})

test('diálogo prende o foco, fecha com Esc e devolve o foco a quem abriu', async ({ page }) => {
  const trigger = isDesktop(page)
    ? page.getByRole('button', { name: 'Criadores' })
    : page.getByRole('button', { name: 'Filtros' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('login só com teclado: erro foca o primeiro campo e o envio funciona', async ({ page }) => {
  await page.goto('/entrar')
  await waitForMocks(page)
  const form = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Entrar' }) })
    .filter({ visible: true })
    .first()
  await form.getByRole('button', { name: 'Entrar' }).focus()
  await page.keyboard.press('Enter')
  const email = form.getByLabel('E-mail')
  await expect(email).toBeFocused()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  const describedBy = await email.getAttribute('aria-describedby')
  expect(describedBy).toBeTruthy()

  await page.keyboard.type('ana@jungle.test')
  await page.keyboard.press('Tab')
  await expect(form.getByLabel(/^Senha/)).toBeFocused()
  await page.keyboard.type('Senha@123')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/')
})

test('adiciona ao carrinho só com teclado e o aviso é anunciado', async ({ page }) => {
  await page.goto('/nft/nft-0042')
  await waitForMocks(page)
  const add = page.getByRole('button', { name: 'Adicionar ao carrinho' }).filter({ visible: true }).first()
  await add.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Adicionado ao carrinho')).toBeVisible()
})

test('com movimento reduzido, o skeleton não anima', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?scenario=slow')
  const shimmer = page.locator('[aria-busy="true"] .shimmer').filter({ visible: true }).first()
  await expect(shimmer).toBeVisible()
  const animation = await shimmer.evaluate((node) => getComputedStyle(node).animationName)
  expect(animation).toBe('none')
})
