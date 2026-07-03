import { createAdminClient } from '../src/db/admin'
import { createClient } from '../src/db/server'
import { sendAskRequestEmail } from '../src/notify/resend'

async function main() {
  console.log('Starting debug-ask-email...')
  
  const helperId = '5d842894-44d7-4f22-9e2d-ffdcf362e9ff'
  const askerId = 'student-sam-id-placeholder'
  
  const admin = createAdminClient()
  console.log('Querying admin.auth.admin.getUserById...')
  try {
    const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(helperId)
    console.log('getUserById result:', {
      email: authUser?.user?.email,
      error: authErr
    })
  } catch (err) {
    console.error('getUserById threw:', err)
  }

  console.log('Sending ask request email via Resend...')
  try {
    const result = await sendAskRequestEmail({
      to: 'helper-mark@example.com',
      askerName: 'Student Sam',
      reviewUrl: 'http://localhost:3001/ask/some-id',
    })
    console.log('sendAskRequestEmail result:', result)
  } catch (err) {
    console.error('sendAskRequestEmail threw:', err)
  }

  console.log('Done.')
}

main().catch(err => {
  console.error('Fatal error:', err)
})
