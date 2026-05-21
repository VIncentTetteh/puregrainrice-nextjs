import OperationsRecordPage from '../../_components/OperationsRecordPage'

export default async function SeasonOperationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OperationsRecordPage mode="season" id={id} />
}
