import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import ts from 'typescript'

const scriptExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx'])
const textExtensions = new Set([
  ...scriptExtensions,
  '.css',
  '.html',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.txt',
  '.svg',
  '.example',
])
const allowedDirectives = [/^\/\/\/\s*<reference\s/]
const ignoredFiles = new Set(['pnpm-lock.yaml'])
const emoji = /(?![©®™])\p{Extended_Pictographic}/u

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean)
  .filter((file) => !ignoredFiles.has(file))
  .filter((file) => !file.startsWith('lighthouse/'))
  .filter((file) => !file.includes('-snapshots/'))

const problems = []

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

function scriptComments(file, text) {
  const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind)
  const seen = new Set()
  const found = []
  const collect = (position) => {
    const ranges = [
      ...(ts.getLeadingCommentRanges(text, position) ?? []),
      ...(ts.getTrailingCommentRanges(text, position) ?? []),
    ]
    for (const range of ranges) {
      if (seen.has(range.pos)) continue
      seen.add(range.pos)
      const value = text.slice(range.pos, range.end)
      if (!allowedDirectives.some((pattern) => pattern.test(value))) found.push(lineOf(text, range.pos))
    }
  }
  const visit = (node) => {
    collect(node.getFullStart())
    collect(node.getEnd())
    for (const child of node.getChildren(source)) visit(child)
  }
  visit(source)
  return found
}

function regexComments(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => lineOf(text, match.index ?? 0))
}

function yamlComments(text) {
  const lines = []
  text.split('\n').forEach((line, index) => {
    let quote = null
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (quote) {
        if (char === quote) quote = null
        continue
      }
      if (char === '"' || char === "'") {
        quote = char
        continue
      }
      if (char === '#' && (i === 0 || /\s/.test(line[i - 1] ?? ''))) {
        lines.push(index + 1)
        break
      }
    }
  })
  return lines
}

for (const file of files) {
  const extension = extname(file).toLowerCase()
  if (!textExtensions.has(extension)) continue
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  let comments = []
  if (scriptExtensions.has(extension)) comments = scriptComments(file, text)
  else if (extension === '.css') comments = regexComments(text, /\/\*[\s\S]*?\*\//g)
  else if (extension === '.html' || extension === '.svg') comments = regexComments(text, /<!--[\s\S]*?-->/g)
  else if (extension === '.yml' || extension === '.yaml') comments = yamlComments(text)
  for (const line of comments) problems.push(`${file}:${line} comentario`)

  text.split('\n').forEach((line, index) => {
    if (emoji.test(line)) problems.push(`${file}:${index + 1} emoji`)
  })
}

if (problems.length > 0) {
  console.error(problems.join('\n'))
  console.error(`\n${problems.length} problema(s) encontrado(s).`)
  process.exit(1)
}
console.log(`check-clean: ${files.length} arquivos sem comentario nem emoji.`)
