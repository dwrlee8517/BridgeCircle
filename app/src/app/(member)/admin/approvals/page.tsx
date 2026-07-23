import { formatDistanceToNow } from 'date-fns'
import { loadSchoolAdminContext } from '@/app/(member)/admin/_lib/school-admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminEntryRepository } from '@/db/repositories/admin-entry'
import { DecisionButtons } from './decision-buttons'

export default async function AdminApprovalsPage() {
  const { client, membership } = await loadSchoolAdminContext()
  const pending = await createAdminEntryRepository(client).listPending({
    organizationId: membership.organization.id,
    limit: 200,
  })

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Approval queue</CardTitle>
              <CardDescription>
                People who finished their {membership.organization.name} setup and are waiting for
                access.
              </CardDescription>
            </div>
            <Badge
              variant={membership.organization.requiresAdminApproval ? 'default' : 'outline'}
              className="shrink-0"
            >
              {membership.organization.requiresAdminApproval
                ? 'Approval required'
                : 'Auto-approve mode'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!membership.organization.requiresAdminApproval ? (
            <p className="mb-4 rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
              Approval mode is off, so invitees normally become active automatically.
            </p>
          ) : null}

          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one is waiting right now.</p>
          ) : (
            <ul className="divide-y">
              {pending.map((person) => (
                <li key={person.membershipId} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-semibold">
                          {person.displayName ?? (
                            <span className="italic text-muted-foreground">
                              Profile in progress
                            </span>
                          )}
                        </span>
                        {person.graduationYear ? (
                          <span className="text-xs text-muted-foreground">
                            Class of {person.graduationYear}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Finished setup{' '}
                        {formatDistanceToNow(new Date(person.requestedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <DecisionButtons membershipId={person.membershipId} />
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
