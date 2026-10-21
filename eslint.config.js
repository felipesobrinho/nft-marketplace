import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const deepModuleImport = {
  regex: '^@/modules/[^/]+/.+',
  message: 'Importe outro módulo só pelo index.ts dele (@/modules/<nome>).',
}
const mocksImport = {
  regex: '^@/mocks(/|$)',
  message: 'A app não importa mocks; só o bootstrap em src/app, por import dinâmico.',
}
const infrastructureImport = {
  regex: '(^|/)infrastructure(/|$)',
  message: 'A interface passa pelos hooks de application, nunca por infrastructure.',
}
const outerLayerImport = {
  regex: '(^|/)(application|infrastructure|ui)(/|$)',
  message: 'domain e contracts são puros: sem application, infrastructure ou ui.',
}
const runtimeLibraries = ['react', 'react-dom', 'axios', 'socket.io-client', 'msw', '@tanstack/*']

const restrict = (patterns, paths = []) => [
  'error',
  {
    paths: paths.map((name) => ({ name, message: 'Biblioteca proibida nesta camada.' })),
    patterns,
  },
]

export default defineConfig([
  globalIgnores([
    '.work',
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'blob-report',
    'lighthouse',
    '.lighthouseci',
    'public/mockServiceWorker.js',
    'src/app/routeTree.gen.ts',
  ]),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat['recommended-latest'],
      pluginQuery.configs['flat/recommended'],
      pluginRouter.configs['flat/recommended'],
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/only-throw-error': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict([deepModuleImport, mocksImport]),
    },
  },
  {
    files: ['src/modules/*/ui/**/*.{ts,tsx}', 'src/shared/ui/**/*.{ts,tsx}', 'src/routes/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict(
        [deepModuleImport, mocksImport, infrastructureImport],
        ['axios', 'socket.io-client'],
      ),
    },
  },
  {
    files: ['src/modules/*/domain/**/*.ts', 'src/shared/domain/**/*.ts', 'src/shared/contracts/**/*.ts'],
    rules: {
      'no-restricted-imports': restrict(
        [
          deepModuleImport,
          mocksImport,
          outerLayerImport,
          { group: ['@tanstack/*'], message: 'Biblioteca proibida nesta camada.' },
        ],
        runtimeLibraries.filter((name) => !name.includes('*')),
      ),
    },
  },
  {
    files: ['src/mocks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict(
        [
          {
            regex: '^@/(app|routes|modules)(/|$)',
            message: 'mocks só importa shared/contracts e shared/domain.',
          },
          {
            regex: '^@/shared/(ui|infrastructure)(/|$)',
            message: 'mocks só importa shared/contracts e shared/domain.',
          },
          { group: ['@tanstack/*'], message: 'Biblioteca proibida nos mocks.' },
        ],
        ['react', 'react-dom', 'axios', 'socket.io-client'],
      ),
    },
  },
  {
    files: ['src/mocks/control/panel/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
    rules: {
      'no-restricted-imports': restrict(
        [
          {
            regex: '^@/(app|routes|modules)(/|$)',
            message: 'O painel da demonstração só fala com os endpoints de controle.',
          },
          {
            regex: '^@/shared/(ui|infrastructure)(/|$)',
            message: 'O painel da demonstração só fala com os endpoints de controle.',
          },
          { group: ['@tanstack/*'], message: 'Biblioteca proibida nos mocks.' },
        ],
        ['axios', 'socket.io-client'],
      ),
    },
  },
])
