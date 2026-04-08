const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT_DIR = path.resolve(__dirname, '..')
const SOURCE_FILE_EXTENSIONS = new Set(['.ts', '.tsx'])
const PATTERNS = [
  { name: 'array-generic', regex: /\b(?:Array|ReadonlyArray)\s*<\s*any\s*>/ },
  { name: 'promise-generic', regex: /\bPromise\s*<\s*any\s*>/ },
  { name: 'record-generic', regex: /\bRecord\s*<[^>]*\bany\b[^>]*>/ },
  { name: 'type-annotation', regex: /:\s*any(?:\[\])?\b/ },
  { name: 'type-assertion', regex: /\bas\s+any\b/ },
  { name: 'generic-argument', regex: /\b\w+\s*<\s*any\s*>/ },
]

function stripStringsAndComments(line) {
  return line
    .replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""')
    .replace(/\/\/.*$/, '')
}

function findExplicitAnyViolations(content) {
  return content
    .split(/\r?\n/)
    .flatMap((line, index) => {
      const normalizedLine = stripStringsAndComments(line)
      const match = PATTERNS.find(({ regex }) => regex.test(normalizedLine))

      if (!match) {
        return []
      }

      return [{
        line: index + 1,
        pattern: match.name,
        snippet: line.trim(),
      }]
    })
}

function isSourceFile(filePath) {
  return SOURCE_FILE_EXTENSIONS.has(path.extname(filePath))
}

function getChangedFilesFromGit() {
  try {
    const output = execSync('git status --short --untracked-files=all', {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => line.slice(3).trim())
      .filter(Boolean)

    return [...new Set(output)]
      .map((relativePath) => path.join(ROOT_DIR, relativePath))
      .filter(isSourceFile)
  } catch {
    return []
  }
}

function collectSourceFiles(targetPath) {
  const resolvedPath = path.resolve(ROOT_DIR, targetPath)

  if (!fs.existsSync(resolvedPath)) {
    return []
  }

  const stats = fs.statSync(resolvedPath)

  if (stats.isFile()) {
    return isSourceFile(resolvedPath) ? [resolvedPath] : []
  }

  return fs.readdirSync(resolvedPath, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') {
      return []
    }

    return collectSourceFiles(path.join(resolvedPath, entry.name))
  })
}

function scanFiles(filePaths) {
  return filePaths.flatMap((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8')
    const violations = findExplicitAnyViolations(content)

    return violations.map((violation) => ({
      ...violation,
      filePath: path.relative(ROOT_DIR, filePath),
    }))
  })
}

function run() {
  const targetPaths = process.argv.slice(2)
  const filesToScan = targetPaths.length
    ? [...new Set(targetPaths.flatMap(collectSourceFiles))]
    : getChangedFilesFromGit()

  if (!filesToScan.length) {
    console.log('No TypeScript files to scan for explicit any.')
    return 0
  }

  const violations = scanFiles(filesToScan)

  if (!violations.length) {
    console.log(`No explicit any found in ${filesToScan.length} file(s).`)
    return 0
  }

  console.error('Explicit any detected:')
  violations.forEach((violation) => {
    console.error(
      `- ${violation.filePath}:${violation.line} [${violation.pattern}] ${violation.snippet}`,
    )
  })
  return 1
}

if (require.main === module) {
  process.exit(run())
}

module.exports = {
  findExplicitAnyViolations,
  scanFiles,
}
