import { describe, expect, it } from 'vitest'
import { findSupportedCurrentRole, isCurrentRoleSupported } from './current-role'

const roles = [
  {
    employer: 'Current Company, Inc.',
    title: 'Product Lead',
    startDate: '2024-01',
    endDate: null,
    description: null,
  },
  {
    employer: 'Former Company',
    title: 'Associate',
    startDate: '2022-01',
    endDate: '2023-12',
    description: null,
  },
]

describe('current role support', () => {
  it('uses the first open-ended role when the provider has no current summary', () => {
    expect(findSupportedCurrentRole(roles)).toEqual(roles[0])
  })

  it('does not substitute another open role when a provider names an ended role as current', () => {
    expect(
      findSupportedCurrentRole(roles, {
        employer: 'Former Company',
        title: 'Associate',
      }),
    ).toBeNull()
  })

  it('matches harmless punctuation and casing differences', () => {
    expect(
      isCurrentRoleSupported({
        name: 'Member',
        headline: null,
        city: null,
        currentEmployer: 'CURRENT COMPANY INC',
        currentTitle: 'product lead',
        university: null,
        major: null,
        careerHistory: roles,
        educationHistory: [],
        skills: [],
      }),
    ).toBe(true)
  })
})
