import { ClientDetail } from '@/components/lab/client-detail'

export default async function LabClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ClientDetail id={id} />
}
