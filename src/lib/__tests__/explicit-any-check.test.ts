const { findExplicitAnyViolations } = require('../../../scripts/verify-no-explicit-any')

describe('findExplicitAnyViolations', () => {
  it('detects explicit any annotations and assertions', () => {
    const result = findExplicitAnyViolations([
      'const value: any = {}',
      'const other = payload as any',
      'const rows: Array<any> = []',
    ].join('\n'))

    expect(result).toHaveLength(3)
    expect(result.map((item: { pattern: string }) => item.pattern)).toEqual([
      'type-annotation',
      'type-assertion',
      'array-generic',
    ])
  })

  it('ignores regular prose that mentions the word any', () => {
    const result = findExplicitAnyViolations([
      '// Check if any item is active',
      'const label = "any value"',
      'const count = 3',
    ].join('\n'))

    expect(result).toEqual([])
  })
})
