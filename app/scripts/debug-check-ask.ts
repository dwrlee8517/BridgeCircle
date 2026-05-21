import { createAdminClient } from '../src/db/admin'

async function main() {
  const supabase = createAdminClient()
  const { data: asks, error } = await supabase
    .from('asks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching asks:', error)
    return
  }

  console.log('Latest 5 asks:')
  console.log(JSON.stringify(asks, null, 2))
}

main().catch(console.error)
