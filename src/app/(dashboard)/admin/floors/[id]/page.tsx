import FloorDetailClient from "@/components/dashboard/FloorDetailClient";

export default async function FloorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FloorDetailClient floorId={id} />;
}
