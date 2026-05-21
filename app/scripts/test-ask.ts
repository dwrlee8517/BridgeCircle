import { createAdminClient } from '../src/db/admin'

async function main() {
  console.log('Initializing admin client...')
  const admin = createAdminClient()

  console.log('Querying base_profiles...')
  const { data: profiles, error: profError } = await admin
    .from('base_profiles')
    .select('user_id, name')
    .in('name', ['Mark Mentor', 'Student Sam'])

  if (profError) {
    console.error('Error querying profiles:', profError)
    process.exit(1)
  }

  console.log('Profiles found:', profiles)
  const mark = profiles?.find((p) => p.name === 'Mark Mentor')
  const sam = profiles?.find((p) => p.name === 'Student Sam')

  if (!mark) {
    console.error('Mark Mentor profile not found')
    process.exit(1)
  }

  console.log(`Calling getUserById for helperId ${mark.user_id}...`)
  try {
    const start = Date.now()
    const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(mark.user_id)
    const duration = Date.now() - start
    console.log(`getUserById took ${duration}ms`)
    if (authErr) {
      console.error('Auth error:', authErr)
    } else {
      console.log('Auth user email:', authUser?.user?.email)
    }
  } catch (err) {
    console.error('Catch block in getUserById:', err)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
