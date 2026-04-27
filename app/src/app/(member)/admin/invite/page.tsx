import { format } from 'date-fns'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/db/server'
import { requireAdmin } from '@/lib/auth/session'
import { CsvInviteForm } from './csv-form'
import { InviteForm } from './invite-form'

type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export default async function AdminInvitePage() {
  const session = await requireAdmin()
  const supabase = await createClient()

  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)
  const adminOrg = roles?.[0] ?? null
  const orgName = (adminOrg?.organizations as { name: string } | null)?.name ?? 'your organization'

  const { data: invites } = adminOrg
    ? await supabase
        .from('invites')
        .select('id, email, status, full_name, graduation_year, created_at, accepted_at')
        .eq('organization_id', adminOrg.organization_id)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite alumni</CardTitle>
          <CardDescription>
            Send join links from invites@bridgecircle.org. Recipients join {orgName} when they
            accept.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single">
            <TabsList>
              <TabsTrigger value="single">Single</TabsTrigger>
              <TabsTrigger value="csv">CSV upload</TabsTrigger>
            </TabsList>
            <TabsContent value="single" className="pt-4">
              <InviteForm />
            </TabsContent>
            <TabsContent value="csv" className="pt-4">
              <CsvInviteForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent invites</CardTitle>
          <CardDescription>Last 50 sent.</CardDescription>
        </CardHeader>
        <CardContent>
          {invites && invites.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Accepted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="font-medium">{i.email}</div>
                      {i.full_name ? (
                        <div className="text-xs text-muted-foreground">{i.full_name}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={i.status as InviteStatus} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(i.created_at), 'MMM d')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {i.accepted_at ? format(new Date(i.accepted_at), 'MMM d') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No invites yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: InviteStatus }) {
  const variant: Record<InviteStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    pending: 'secondary',
    accepted: 'default',
    expired: 'outline',
    revoked: 'destructive',
  }
  return <Badge variant={variant[status]}>{status}</Badge>
}
