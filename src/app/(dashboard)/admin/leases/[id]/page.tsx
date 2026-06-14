import LeaseDetailClient from "@/components/dashboard/LeaseDetailClient";

export default async function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LeaseDetailClient userId={id} />;
}
