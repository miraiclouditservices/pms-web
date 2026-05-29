"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/admin/users/create";

  return (
    <div className="d-flex" style={{ backgroundColor: 'var(--color-bg-dashboard)', minHeight: '100vh', fontFamily: 'var(--font-geist-sans)' }}>
      {/* Fixed Sidebar */}
      {!hideSidebar && <Sidebar />}
      
      {/* Main Content Area */}
      <div className="flex-grow-1" style={{ marginLeft: hideSidebar ? '0px' : '220px', transition: 'margin-left 0.3s ease', minWidth: 0 }}>
        {!hideSidebar && <Header />}
        <main className={hideSidebar ? "p-0" : "p-4"}>
          {children}
        </main>
      </div>
    </div>
  );
}
