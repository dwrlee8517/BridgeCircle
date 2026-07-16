import 'server-only'

import { createAdminClient } from '@/db/admin'

export async function createAccountExportSignedUrl(bucket: string, path: string) {
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrl(path, 60)
  if (error) throw new Error('Could not create account export download')
  return data.signedUrl
}
