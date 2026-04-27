import { format } from 'date-fns'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/db/server'
import { listMembers, type MembershipStatus } from '@/lib/admin/listMembers'
import { requireAdmin } from '@/lib/auth/session'

export default async function AdminMembersPage() {
  const session = await requireAdmin()
  const supabase = await createClient()

  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id, organizations(name)')
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

  const orgName = (adminOrg.organizations as { name: string } | null)?.name ?? 'your organization'
  const members = await listMembers(supabase, adminOrg.organization_id)

  const counts = {
    active: members.filter((m) => m.status === 'active').length,
    pending: members.filter((m) => m.status === 'pending').length,
    mentors: members.filter((m) => m.isOpenAsMentor).length,
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Everyone who's joined {orgName} (or accepted an invite and is awaiting approval).
              </CardDescription>
            </div>
            <div className="flex gap-1.5 text-xs">
              <Badge variant="default">{counts.active} active</Badge>
              {counts.pending > 0 ? (
                <Badge variant="secondary">{counts.pending} pending</Badge>
              ) : null}
              <Badge variant="outline">{counts.mentors} open mentors</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No members yet. Send some invites to get started.
            </p>
          ) : (
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
                          <Badge variant="default" className="ml-2 align-middle text-[10px]">
                            mentor
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{m.graduationYear ?? '—'}</TableCell>
                    <TableCell className="text-sm">{m.city ?? '—'}</TableCell>
                    <TableCell className="text-sm">{m.currentEmployer ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      <CompletionCell percent={m.completionPercent} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.joinedAt ? format(new Date(m.joinedAt), 'MMM d') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: MembershipStatus }) {
  const variant: Record<MembershipStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    active: 'default',
    pending: 'secondary',
    rejected: 'outline',
    revoked: 'destructive',
  }
  return <Badge variant={variant[status]}>{status}</Badge>
}

function CompletionCell({ percent }: { percent: number }) {
  const tone =
    percent >= 80 ? 'text-emerald-600' : percent >= 50 ? 'text-amber-600' : 'text-destructive'
  return <span className={tone}>{percent}%</span>
}
