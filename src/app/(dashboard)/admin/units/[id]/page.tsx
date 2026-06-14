import UnitDetailClient from "@/components/dashboard/UnitDetailClient";

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UnitDetailClient unitId={id} />;
}
