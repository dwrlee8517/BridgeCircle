import { createAdminClient } from '../src/db/admin'
import { createClient } from '../src/db/server'
import { sendMentorshipRequestEmail } from '../src/notify/resend'

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

  console.log('Sending mentorship request email via Resend...')
  try {
    const result = await sendMentorshipRequestEmail({
      to: 'mentor-mark@example.com',
      menteeName: 'Student Sam',
      reviewUrl: 'http://localhost:3000/ask/some-id',
      askType: 'mentorship',
    })
    console.log('sendMentorshipRequestEmail result:', result)
  } catch (err) {
    console.error('sendMentorshipRequestEmail threw:', err)
  }

  console.log('Done.')
}

main().catch(err => {
  console.error('Fatal error:', err)
})
