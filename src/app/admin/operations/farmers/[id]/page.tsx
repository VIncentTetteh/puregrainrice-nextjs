import OperationsRecordPage from '../../_components/OperationsRecordPage'

export default async function FarmerOperationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OperationsRecordPage mode="farmer" id={id} />
}
