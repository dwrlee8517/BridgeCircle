import { redirect } from 'next/navigation'

type SearchParams = Record<string, string | string[] | undefined>

export default async function AskPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const query = singleParam(params.nl)?.trim() || singleParam(params.q)?.trim()
  const page = singleParam(params.page)?.trim()

  if (query) {
    const next = new URLSearchParams({ nl: query })
    if (page) next.set('page', page)
    redirect(`/people?${next.toString()}`)
  }

  redirect('/')
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
