import PropertyDetailClient from "./PropertyDetailClient";

export function generateStaticParams() {
  // Pre-render a placeholder static template so the compiler successfully generates static routes
  return [{ id: "fallback" }];
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <PropertyDetailClient propertyId={resolvedParams.id} />;
}
