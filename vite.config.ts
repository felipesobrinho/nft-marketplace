import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const preloadedFonts = ['roboto-mono-latin-400-normal', 'roboto-mono-latin-700-normal']

function preloadFonts(): Plugin {
  return {
    name: 'kurio:preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const assets = Object.values(ctx.bundle ?? {}).filter(
          (chunk) =>
            chunk.type === 'asset' &&
            chunk.fileName.endsWith('.woff2') &&
            preloadedFonts.some((font) => chunk.fileName.includes(font)),
        )
        return assets.map((asset) => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            href: `/${asset.fileName}`,
            as: 'font',
            type: 'font/woff2',
            crossorigin: '',
          },
          injectTo: 'head-prepend' as const,
        }))
      },
    },
  }
}

function preloadMocks(): Plugin {
  return {
    name: 'kurio:preload-mocks',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const chunks = Object.values(ctx.bundle ?? {})
        const entry = chunks.find(
          (chunk) =>
            chunk.type === 'chunk' &&
            (chunk.facadeModuleId ?? '').replace(/\\/g, '/').endsWith('/src/mocks/browser.ts'),
        )
        if (!entry || entry.type !== 'chunk') return []
        return [entry.fileName, ...entry.imports]
          .filter((file) => !html.includes(file))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'modulepreload', href: `/${file}`, crossorigin: '', fetchpriority: 'low' },
            injectTo: 'head' as const,
          }))
      },
    },
  }
}

function inlineStyles(): Plugin {
  return {
    name: 'kurio:inline-styles',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = bundle['index.html']
      if (!html || html.type !== 'asset' || typeof html.source !== 'string') return
      let source = html.source
      for (const [fileName, asset] of Object.entries(bundle)) {
        if (asset.type !== 'asset' || !fileName.endsWith('.css') || typeof asset.source !== 'string') continue
        const link = new RegExp(`<link rel="stylesheet"[^>]*href="/${fileName}"[^>]*>`)
        if (!link.test(source)) continue
        source = source.replace(link, () => `<style>${String(asset.source)}</style>`)
        delete bundle[fileName]
      }
      html.source = source
    },
  }
}

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      routesDirectory: './src/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
      autoCodeSplitting: true,
      quoteStyle: 'single',
      semicolons: false,
    }),
    react(),
    tailwindcss(),
    preloadFonts(),
    preloadMocks(),
    inlineStyles(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
