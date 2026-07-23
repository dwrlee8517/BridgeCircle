import { format } from 'date-fns'
import { Mail } from 'lucide-react'
import { loadSchoolAdminContext } from '@/app/(member)/admin/_lib/school-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LifecycleStatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createAdminInviteRepository } from '@/db/repositories/invites'
import { displayOrgName } from '@/lib/utils'
import { CsvInviteForm } from './csv-form'
import { InviteForm } from './invite-form'
import { InviteRowActions } from './invite-row-actions'

export default async function AdminInvitePage() {
  const { client, membership } = await loadSchoolAdminContext()
  const orgName = displayOrgName(membership.organization.name)
  const invites = await createAdminInviteRepository(client).list({
    organizationId: membership.organization.id,
    limit: 50,
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Invite members</CardTitle>
          <CardDescription>
            Send secure, 14-day join links for {orgName}. Existing pending invites are reused safely
            instead of creating duplicate access paths.
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
          <CardDescription>The most recent 50 invitations.</CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="font-medium">{invite.email}</div>
                      {invite.fullName ? (
                        <div className="text-xs text-muted-foreground">{invite.fullName}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <LifecycleStatusBadge status={invite.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(invite.createdAt), 'MMM d')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(invite.expiresAt), 'MMM d')}
                    </TableCell>
                    <TableCell>
                      {invite.status === 'pending' ? (
                        <InviteRowActions inviteId={invite.id} email={invite.email} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Mail}
              title="No invites yet"
              description="Send the first invite above. The join link is delivered by the outbox worker."
              size="inline"
              className="border-none bg-transparent shadow-none"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
