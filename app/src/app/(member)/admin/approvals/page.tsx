import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { listPendingMemberships } from '@/lib/admin/listPendingMemberships'
import { requireAdmin } from '@/lib/auth/session'
import { DecisionButtons } from './decision-buttons'

export default async function AdminApprovalsPage() {
  const session = await requireAdmin()
  const supabase = await createClient()

  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id, organizations(name, requires_admin_approval)')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)

  const adminOrg = roles?.[0]
  if (!adminOrg) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-muted-foreground">No admin organization.</p>
      </div>
    )
  }

  const org = adminOrg.organizations as { name: string; requires_admin_approval: boolean } | null
  const orgName = org?.name ?? 'your organization'
  const requiresApproval = org?.requires_admin_approval ?? false

  const pending = await listPendingMemberships(supabase, adminOrg.organization_id)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Approval queue</CardTitle>
              <CardDescription>
                People who accepted an invite to {orgName} and are waiting for an admin to confirm
                them. Approve to grant access; reject to refuse politely.
              </CardDescription>
            </div>
            <Badge variant={requiresApproval ? 'default' : 'outline'} className="shrink-0">
              {requiresApproval ? 'Approval required' : 'Auto-approve mode'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!requiresApproval ? (
            <div className="mb-4 rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
              Approval mode is off — invitees become active automatically. New pending rows normally
              won't appear here unless someone bypasses the invite flow. Flip{' '}
              <Link href="/admin/members" className="underline">
                approval mode
              </Link>{' '}
              on if you want to gate every signup.
            </div>
          ) : null}

          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No one's waiting. Pending members will show up here as they sign up.
            </p>
          ) : (
            <ul className="divide-y">
              {pending.map((p) => (
                <li key={p.membershipId} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-semibold">
                          {p.name ?? (
                            <span className="italic text-muted-foreground">(no name)</span>
                          )}
                        </span>
                        {p.graduationYear ? (
                          <span className="text-xs text-muted-foreground">
                            class of {p.graduationYear}
                          </span>
                        ) : null}
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{p.email}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {p.currentTitle && p.currentEmployer
                          ? `${p.currentTitle} at ${p.currentEmployer}`
                          : (p.currentTitle ?? p.currentEmployer ?? 'no current role')}
                        {p.city ? ` · ${p.city}` : ''}
                        {p.university ? ` · ${p.university}` : ''}
                        {p.major ? ` (${p.major})` : ''}
                      </div>
                      {p.bio ? (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                        {p.linkedinUrl ? (
                          <a
                            href={p.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-foreground"
                          >
                            LinkedIn
                          </a>
                        ) : null}
                        <span>
                          signed up{' '}
                          {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                        </span>
                        {p.inviteSentAt ? (
                          <span>invite sent {format(new Date(p.inviteSentAt), 'MMM d')}</span>
                        ) : (
                          <span className="italic">no matching invite</span>
                        )}
                      </div>
                    </div>
                    <DecisionButtons membershipId={p.membershipId} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
