import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mirai Cloud – Smart Property & Tenant Management Platform",
  description: "Manage global properties, automate leasing, streamline rent billing, and control tenants with a secure, AI-powered enterprise dashboard. Built for modern real estate operations with real-time analytics and multi-tenant access control.",
  keywords: [
    "Property management software",
    "Tenant management system",
    "Real estate automation platform",
    "Smart leasing dashboard",
    "Global property management SaaS"
  ],
  authors: [{ name: "Mirai Cloud" }],
  openGraph: {
    title: "Mirai Cloud – Smart Property & Tenant Management Platform",
    description: "Manage global properties, automate leasing, streamline rent billing, and control tenants with a secure, AI-powered enterprise dashboard.",
    type: "website",
  }
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
