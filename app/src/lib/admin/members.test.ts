import { describe, expect, it, vi } from 'vitest'
import type { AdminMembersRepository } from './contracts'
import { changeAdminRole, listAdminMembers, parseAdminMemberFilters } from './members'

const ok = { ok: true as const, status: 'granted' as const }

function repository(overrides?: Partial<AdminMembersRepository>): AdminMembersRepository {
  return {
    list: vi.fn().mockResolvedValue({ ok: true, total: 0, items: [] }),
    grantRole: vi.fn().mockResolvedValue(ok),
    revokeRole: vi.fn().mockResolvedValue({ ok: true, status: 'revoked' }),
    ...overrides,
  }
}

describe('parseAdminMemberFilters', () => {
  it('degrades malformed params to no filter instead of failing', () => {
    expect(
      parseAdminMemberFilters({ q: '  ', year: 'nope', status: 'weird', help: '', inactive: '0' }),
    ).toEqual({ search: null, classYear: null, status: null, openToHelp: null, inactiveDays: null })
  })

  it('accepts well-formed params', () => {
    expect(
      parseAdminMemberFilters({
        q: ' Mei ',
        year: '2012',
        status: 'active',
        help: '1',
        inactive: '30',
      }),
    ).toEqual({
      search: 'Mei',
      classYear: 2012,
      status: 'active',
      openToHelp: true,
      inactiveDays: 30,
    })
  })

  it('bounds the search length', () => {
    const filters = parseAdminMemberFilters({ q: 'a'.repeat(500) })
    expect(filters.search).toHaveLength(120)
  })
})

describe('listAdminMembers', () => {
  it('rejects out-of-range paging before touching the repository', async () => {
    const repo = repository()
    await expect(listAdminMembers(repo, { membershipId: 'm', limit: 500 })).resolves.toEqual({
      ok: false,
      error: 'invalid_input',
    })
    expect(repo.list).not.toHaveBeenCalled()
  })

  it('fills paging defaults', async () => {
    const repo = repository()
    await listAdminMembers(repo, { membershipId: 'm' })
    expect(repo.list).toHaveBeenCalledWith(expect.objectContaining({ limit: 100, offset: 0 }))
  })
})

describe('changeAdminRole', () => {
  it('refuses roles outside the grantable set', async () => {
    const repo = repository()
    await expect(
      changeAdminRole(repo, {
        membershipId: 'a',
        targetMembershipId: 'b',
        role: 'super_admin',
        action: 'grant',
      }),
    ).resolves.toEqual({ ok: false, error: 'invalid_input' })
    expect(repo.grantRole).not.toHaveBeenCalled()
  })

  it('refuses self-targeting', async () => {
    const repo = repository()
    await expect(
      changeAdminRole(repo, {
        membershipId: 'same',
        targetMembershipId: 'same',
        role: 'ambassador',
        action: 'revoke',
      }),
    ).resolves.toEqual({ ok: false, error: 'forbidden' })
    expect(repo.revokeRole).not.toHaveBeenCalled()
  })

  it('routes grant and revoke to the matching repository command', async () => {
    const repo = repository()
    await changeAdminRole(repo, {
      membershipId: 'a',
      targetMembershipId: 'b',
      role: 'event_moderator',
      action: 'grant',
    })
    expect(repo.grantRole).toHaveBeenCalledWith({
      membershipId: 'a',
      targetMembershipId: 'b',
      role: 'event_moderator',
    })
    await changeAdminRole(repo, {
      membershipId: 'a',
      targetMembershipId: 'b',
      role: 'event_moderator',
      action: 'revoke',
    })
    expect(repo.revokeRole).toHaveBeenCalled()
  })
})
