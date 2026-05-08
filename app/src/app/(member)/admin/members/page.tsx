import { format } from 'date-fns'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge as Pill } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { createClient } from '@/db/server'
import { listMembers, type MembershipStatus } from '@/lib/admin/listMembers'
import { requireAdmin } from '@/lib/auth/session'
import { displayOrgName } from '@/lib/utils'
import { ApprovalModeToggle } from './approval-mode-toggle'
import { MemberRowActions } from './member-row-actions'

export default async function AdminMembersPage() {
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
  const orgName = displayOrgName(org?.name ?? 'your organization')
  const requiresApproval = org?.requires_admin_approval ?? false
  const members = await listMembers(supabase, adminOrg.organization_id)

  const counts = {
    active: members.filter((m) => m.status === 'active').length,
    pending: members.filter((m) => m.status === 'pending').length,
    revoked: members.filter((m) => m.status === 'revoked').length,
    mentors: members.filter((m) => m.isOpenAsMentor).length,
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Approval mode</CardTitle>
              <CardDescription>
                {requiresApproval
                  ? `New ${orgName} signups land in the approval queue and an admin must approve them before they gain access.`
                  : `New ${orgName} signups are auto-approved as soon as they redeem a valid invite token.`}
              </CardDescription>
            </div>
            <ApprovalModeToggle requiresApproval={requiresApproval} />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Everyone who&apos;s joined {orgName}, plus pending and deactivated accounts.{' '}
                <Link href="/admin/approvals" className="underline">
                  Approval queue
                </Link>{' '}
                is the focused view for pending decisions.
              </CardDescription>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5 text-xs">
              <Badge variant="default">{counts.active} active</Badge>
              {counts.pending > 0 ? (
                <Badge variant="secondary">{counts.pending} pending</Badge>
              ) : null}
              {counts.revoked > 0 ? (
                <Badge variant="destructive">{counts.revoked} revoked</Badge>
              ) : null}
              <Badge variant="outline">{counts.mentors} open mentors</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No one's joined yet"
              description={`${orgName} doesn't have any members yet — send your first invites.`}
              action={{ label: 'Send invites', href: '/admin/invite' }}
              size="inline"
              className="border-none bg-transparent shadow-none"
            />
          ) : (
            <div className="-mx-6 overflow-x-auto px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Profile</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.membershipId}>
                      <TableCell>
                        <div className="font-medium">
                          <Link href={`/profile/${m.userId}`} className="hover:underline">
                            {m.name ?? (
                              <span className="italic text-muted-foreground">(no name)</span>
                            )}
                          </Link>
                          {m.isOpenAsMentor ? (
                            <Pill tone="open" className="ml-2 align-middle text-[10px]" dot>
                              mentor
                            </Pill>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{m.graduationYear ?? '—'}</TableCell>
                      <TableCell className="text-sm">{m.city ?? '—'}</TableCell>
                      <TableCell className="text-sm">{m.currentEmployer ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={m.status} />
                          {m.deletionScheduledFor ? (
                            <DeletionBadge
                              scheduledFor={m.deletionScheduledFor}
                              initiatedByAdmin={m.deletionInitiatedByAdmin}
                            />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        <CompletionCell percent={m.completionPercent} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.joinedAt ? format(new Date(m.joinedAt), 'MMM d') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <MemberRowActions
                          membershipId={m.membershipId}
                          userId={m.userId}
                          status={m.status}
                          memberName={m.name}
                          memberEmail={m.email}
                          deletionScheduledFor={m.deletionScheduledFor}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: MembershipStatus }) {
  const tone = {
    active: 'open',
    pending: 'warn',
    rejected: 'muted',
    revoked: 'alert',
    self_deactivated: 'warn',
  } as const
  const label: Record<MembershipStatus, string> = {
    active: 'active',
    pending: 'pending',
    rejected: 'rejected',
    revoked: 'revoked',
    self_deactivated: 'self-paused',
  }
  return (
    <Pill tone={tone[status]} dot>
      {label[status]}
    </Pill>
  )
}

function DeletionBadge({
  scheduledFor,
  initiatedByAdmin,
}: {
  scheduledFor: string
  initiatedByAdmin: boolean
}) {
  const due = new Date(scheduledFor).getTime()
  // eslint-disable-next-line react-hooks/purity -- server component, label re-derives per request
  const ms = due - Date.now()
  const days = Math.round(ms / (1000 * 60 * 60 * 24))
  const overdue = ms < 0
  const label = overdue
    ? `delete ${Math.abs(days)}d overdue`
    : days === 0
      ? 'delete today'
      : `delete in ${days}d`
  const initiator = initiatedByAdmin ? 'admin' : 'self'
  return (
    <Badge
      variant={overdue ? 'destructive' : 'outline'}
      className="text-[10px] leading-4"
      title={`Initiated by ${initiator}`}
    >
      {label}
    </Badge>
  )
}

function CompletionCell({ percent }: { percent: number }) {
  const tone =
    percent >= 80 ? 'text-emerald-600' : percent >= 50 ? 'text-amber-600' : 'text-destructive'
  return <span className={tone}>{percent}%</span>
}
