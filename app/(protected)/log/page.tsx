import { redirect } from 'next/navigation'

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const query = date ? `?tab=log&date=${date}` : '?tab=log'
  redirect(`/nutrition${query}`)
}
