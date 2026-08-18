import { describe, expect, it } from 'vitest'
import rawFixture from './__fixtures__/golden-search.json'
import {
  evaluateCase,
  type GoldenCase,
  type IdentityIndex,
  lintFixture,
  parseGoldenFixture,
  type ResolvedRow,
  summarize,
} from './golden'

const ORG = {
  viewer: 'viewer-1@eval.test',
  ana: 'helper-010@eval.test',
  sam: 'helper-030@eval.test',
  maya: 'helper-055@eval.test',
  otis: 'helper-057@eval.test',
  yusuf: 'helper-036@eval.test',
} as const

function identity(): IdentityIndex {
  const membershipByEmail = new Map<string, string>()
  for (const [index, email] of Object.values(ORG).entries()) {
    membershipByEmail.set(email, `m-${index + 1}`)
  }
  return {
    membershipByEmail,
    topicHolders: new Map([
      ['Consulting', new Set(['m-2', 'm-3'])],
      ['Managing people', new Set(['m-6'])],
    ]),
    neverEligible: new Set(['m-4']),
  }
}

function row(email: keyof typeof ORG): ResolvedRow {
  const index = Object.keys(ORG).indexOf(email)
  return { membershipId: `m-${index + 1}`, email: ORG[email] }
}

function goldenCase(overrides: Partial<GoldenCase>): GoldenCase {
  return {
    id: 'case-under-test',
    viewer: ORG.viewer,
    question: 'consulting',
    regime: 'keyword',
    layers: ['unit'],
    expect: { kind: 'hit5', who: [ORG.ana] },
    acceptable_surface: [],
    must_not_surface: [],
    rationale: 'test case',
    ...overrides,
  }
}

describe('evaluateCase expectation kinds', () => {
  it('top1 passes when the expected member is first and fails otherwise', () => {
    const caseDef = goldenCase({ expect: { kind: 'top1', who: [ORG.ana] } })
    expect(evaluateCase(caseDef, [[row('ana'), row('sam')]], identity()).passed).toBe(true)
    const missed = evaluateCase(caseDef, [[row('sam'), row('ana')]], identity())
    expect(missed.passed).toBe(false)
    expect(missed.expectationFailures[0]).toContain('top1')
  })

  it('hit5 requires every who within the top five', () => {
    const caseDef = goldenCase({ expect: { kind: 'hit5', who: [ORG.ana, ORG.sam] } })
    expect(evaluateCase(caseDef, [[row('sam'), row('ana')]], identity()).passed).toBe(true)
    const sixDeep = [row('yusuf'), row('yusuf'), row('yusuf'), row('yusuf'), row('sam'), row('ana')]
    const missed = evaluateCase(caseDef, [sixDeep], identity())
    expect(missed.passed).toBe(false)
    expect(missed.expectationFailures[0]).toContain(ORG.ana)
  })

  it('pool_only fails on any top-five member outside the topic pool', () => {
    const caseDef = goldenCase({ expect: { kind: 'pool_only', topics: ['Consulting'] } })
    expect(evaluateCase(caseDef, [[row('sam'), row('otis')]], identity()).passed).toBe(false)
    expect(evaluateCase(caseDef, [[row('sam'), row('maya')]], identity()).passed).toBe(false)
    expect(evaluateCase(caseDef, [[row('sam')]], identity()).passed).toBe(true)
  })

  it('pool_hit passes when at least one top-five member holds a pool topic', () => {
    const caseDef = goldenCase({ expect: { kind: 'pool_hit', topics: ['Managing people'] } })
    expect(evaluateCase(caseDef, [[row('ana'), row('yusuf')]], identity()).passed).toBe(true)
    expect(evaluateCase(caseDef, [[row('ana')]], identity()).passed).toBe(false)
  })

  it('empty passes only on zero results', () => {
    const caseDef = goldenCase({ expect: { kind: 'empty' } })
    expect(evaluateCase(caseDef, [[]], identity()).passed).toBe(true)
    expect(evaluateCase(caseDef, [[row('ana')]], identity()).passed).toBe(false)
  })

  it('invariants_only asserts nothing beyond must_not and the universal invariants', () => {
    const caseDef = goldenCase({
      expect: { kind: 'invariants_only' },
      must_not_surface: [ORG.otis],
    })
    expect(evaluateCase(caseDef, [[row('ana'), row('sam')]], identity()).passed).toBe(true)
    expect(evaluateCase(caseDef, [[]], identity()).passed).toBe(true)
    expect(evaluateCase(caseDef, [[row('otis')]], identity()).passed).toBe(false)
  })

  it('stable compares two runs and demands a second one', () => {
    const caseDef = goldenCase({ expect: { kind: 'stable' } })
    const runOrder = [row('ana'), row('sam')]
    expect(evaluateCase(caseDef, [runOrder, [...runOrder]], identity()).passed).toBe(true)
    expect(evaluateCase(caseDef, [runOrder, [row('sam'), row('ana')]], identity()).passed).toBe(
      false,
    )
    expect(evaluateCase(caseDef, [runOrder], identity()).passed).toBe(false)
  })

  it('order asserts relative ranking across the full result list', () => {
    const caseDef = goldenCase({ expect: { kind: 'order', who: [ORG.ana, ORG.sam] } })
    expect(evaluateCase(caseDef, [[row('yusuf'), row('ana'), row('sam')]], identity()).passed).toBe(
      true,
    )
    expect(evaluateCase(caseDef, [[row('sam'), row('ana')]], identity()).passed).toBe(false)
    expect(evaluateCase(caseDef, [[row('ana')]], identity()).passed).toBe(false)
  })

  it('nested also expectations must both hold', () => {
    const caseDef = goldenCase({
      expect: { kind: 'hit5', who: [ORG.ana], also: { kind: 'pool_only', topics: ['Consulting'] } },
    })
    expect(evaluateCase(caseDef, [[row('ana'), row('sam')]], identity()).passed).toBe(true)
    expect(evaluateCase(caseDef, [[row('ana'), row('otis')]], identity()).passed).toBe(false)
    expect(evaluateCase(caseDef, [[row('sam')]], identity()).passed).toBe(false)
  })
})

describe('evaluateCase hard rules', () => {
  it('acceptable_surface members are neutral — never required, never penalized', () => {
    const caseDef = goldenCase({
      expect: { kind: 'hit5', who: [ORG.ana] },
      acceptable_surface: [ORG.sam],
    })
    expect(evaluateCase(caseDef, [[row('ana'), row('sam')]], identity()).passed).toBe(true)
    expect(evaluateCase(caseDef, [[row('ana')]], identity()).passed).toBe(true)
  })

  it('must_not_surface in the top five is a hard failure', () => {
    const caseDef = goldenCase({ must_not_surface: [ORG.otis] })
    const result = evaluateCase(caseDef, [[row('ana'), row('otis')]], identity())
    expect(result.passed).toBe(false)
    expect(result.hardFailures[0]).toContain(ORG.otis)
  })

  it('universal invariants: the viewer and never-eligible members may not surface at any rank', () => {
    const caseDef = goldenCase({})
    const viewerBack = evaluateCase(caseDef, [[row('ana'), row('viewer')]], identity())
    expect(viewerBack.hardFailures.some((message) => message.includes('viewer'))).toBe(true)
    const ineligible = evaluateCase(caseDef, [[row('ana'), row('maya')]], identity())
    expect(ineligible.hardFailures.some((message) => message.includes('never-eligible'))).toBe(true)
  })

  it('fail_ok tolerates expectation misses but never hard failures', () => {
    const missOnly = goldenCase({ fail_ok: true, expect: { kind: 'hit5', who: [ORG.ana] } })
    const tolerated = evaluateCase(missOnly, [[row('sam')]], identity())
    expect(tolerated.passed).toBe(true)
    expect(tolerated.expectationFailures.length).toBeGreaterThan(0)

    const withTrap = goldenCase({ fail_ok: true, must_not_surface: [ORG.otis] })
    expect(evaluateCase(withTrap, [[row('otis')]], identity()).passed).toBe(false)
  })
})

describe('lintFixture', () => {
  it('flags unknown emails, unknown topics, overlapping sets, and duplicate ids', () => {
    const fixtureShape = {
      $comment: 'test',
      version: '0',
      org: 'eval',
      deferred_axes: [],
      cases: [
        goldenCase({ id: 'dup', viewer: 'ghost@eval.test', must_not_surface: [ORG.ana] }),
        goldenCase({ id: 'dup', expect: { kind: 'pool_only', topics: ['No Such Topic'] } }),
      ],
    }
    const errors = lintFixture(parseGoldenFixture(fixtureShape), identity())
    const messages = errors.map((error) => error.message).join(' | ')
    expect(messages).toContain('unknown email ghost@eval.test')
    expect(messages).toContain("unknown topic 'No Such Topic'")
    expect(messages).toContain('duplicate case id')
    expect(messages).toContain(`${ORG.ana} appears in both expect.who and must_not_surface`)
  })

  it('accepts a clean case', () => {
    const fixtureShape = {
      $comment: 'test',
      version: '0',
      org: 'eval',
      deferred_axes: [],
      cases: [goldenCase({ acceptable_surface: [ORG.sam] })],
    }
    expect(lintFixture(parseGoldenFixture(fixtureShape), identity())).toEqual([])
  })
})

describe('summarize', () => {
  it('aggregates per regime and separates the fail_ok ledger', () => {
    const results = [
      evaluateCase(goldenCase({ id: 'a', regime: 'keyword' }), [[row('ana')]], identity()),
      evaluateCase(goldenCase({ id: 'b', regime: 'keyword' }), [[row('sam')]], identity()),
      evaluateCase(
        goldenCase({ id: 'c', regime: 'vocab-mismatch', fail_ok: true }),
        [[row('sam')]],
        identity(),
      ),
    ]
    const summaries = summarize(results)
    const keyword = summaries.find((summary) => summary.regime === 'keyword')
    const mismatch = summaries.find((summary) => summary.regime === 'vocab-mismatch')
    expect(keyword).toMatchObject({ total: 2, passed: 1 })
    expect(mismatch).toMatchObject({ total: 1, passed: 1, expectedMisses: 1 })
  })
})

describe('the checked-in fixture', () => {
  it('parses under the schema', () => {
    const fixture = parseGoldenFixture(rawFixture)
    expect(fixture.cases.length).toBeGreaterThanOrEqual(24)
    expect(fixture.org).toBe('eval')
  })
})
