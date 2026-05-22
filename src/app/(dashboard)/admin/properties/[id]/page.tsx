import PropertyDetailClient from "./PropertyDetailClient";



export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <PropertyDetailClient propertyId={resolvedParams.id} />;
}
