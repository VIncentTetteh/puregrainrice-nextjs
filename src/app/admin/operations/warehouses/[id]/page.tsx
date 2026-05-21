import OperationsRecordPage from '../../_components/OperationsRecordPage'

export default async function WarehouseOperationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OperationsRecordPage mode="warehouse" id={id} />
}
