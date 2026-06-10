"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/styles/modules/Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }
    }
  }, []);


  const displayName = user ? user.name : "Admin User";
  const displayRole = user
    ? (user.role === "Admin" ? "SUPER_ADMIN" : user.role === "Owner" ? "OFFICE_OWNER" : user.role)
    : "SUPER_ADMIN";
  const avatarChar = displayName ? displayName.charAt(0).toUpperCase() : "A";

  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "Admin" || user?.role === "Super Admin";
  const permissions = (user as any)?.permissions || [];

  const hasAccess = (permission: string) => isSuperAdmin || permissions.includes(permission);

  const menuGroups = [
    {
      label: "Main",
      items: [
        ...(isSuperAdmin || user?.role === 'STAFF_ADMIN' || permissions.length > 0 ? [{ name: "Dashboard", path: "/admin/dashboard", icon: "hgi-dashboard-square-01" }] : []),
        ...(hasAccess('view_properties') || user?.role === 'STAFF_ADMIN' ? [{ name: "Properties", path: "/admin/properties", icon: "hgi-building-03" }] : []),
        ...(hasAccess('view_floors') || user?.role === 'STAFF_ADMIN' ? [{ name: "Floors", path: "/admin/floors", icon: "hgi-layers-01" }] : []),
        ...(hasAccess('view_floors') || user?.role === 'STAFF_ADMIN' ? [{ name: "Units and sft", path: "/admin/units", icon: "hgi-door-01" }] : []),
        ...(hasAccess('view_tenants') || user?.role === 'STAFF_ADMIN' ? [{ name: "Leases", path: "/admin/leases", icon: "hgi-agreement-01" }] : []),
        // ...(hasAccess('view_finance') || user?.role === 'STAFF_ADMIN' ? [
        //   { name: "Finance / Billing", path: "/admin/finance", icon: "hgi-invoice-01" }
        // ] : []),
        ...(user?.role === 'SUPER_ADMIN' || user?.role === 'Admin' || user?.role === 'FLOOR_ADMIN' || user?.role === 'Owner' || user?.role === 'OFFICE_OWNER' || user?.role === 'STAFF_ADMIN' ? [
          { name: "Payments", path: "/admin/payments", icon: "hgi-credit-card" }
        ] : []),
      ]
    },
    {
      label: "Operations",
      items: [
        ...(hasAccess('manage_helpdesk') || user?.role === 'STAFF_ADMIN' ? [
          { name: "Helpdesk", path: "/admin/helpdesk", icon: "hgi-headset" }
        ] : []),
        ...(hasAccess('manage_visitors') || user?.role === 'STAFF_ADMIN' ? [
          { name: "Visitors", path: "/admin/visitors", icon: "hgi-identity-card" },
          { name: "Materials", path: "/admin/materials", icon: "hgi-package" },
          { name: "Bookings", path: "/admin/bookings", icon: "hgi-calendar-01" }
        ] : []),
        ...(isSuperAdmin || user?.role === 'STAFF_ADMIN' || user?.role === 'FLOOR_ADMIN' ? [
          { name: "Assets", path: "/admin/assets", icon: "hgi-tools" }
        ] : []),
        ...(isSuperAdmin || user?.role === 'STAFF_ADMIN' ? [
          { name: "Vendors", path: "/admin/vendors", icon: "hgi-truck" }
        ] : [])
      ]
    },
    {
      label: "Management",
      items: [
        ...(hasAccess('manage_staff') ? [
          { name: "Access Management", path: "/admin/users", icon: "hgi-user-shield-01" },
        ] : []),
        ...(hasAccess('view_analytics') ? [
          { name: "Occupancy Analytics", path: "/admin/occupancy", icon: "hgi-pie-chart" }
        ] : []),
        ...(isSuperAdmin || user?.role === 'STAFF_ADMIN' ? [
          { name: "Reports", path: "/admin/reports", icon: "hgi-analytics-01" }
        ] : [])
      ]
    },
    {
      label: "Account",
      items: [
        { name: "Settings & Profile", path: "/admin/settings", icon: "hgi-settings-01" }
      ]
    }
  ].map(group => {
    if (user?.role === "Owner" || user?.role === "OFFICE_OWNER") {
      const itemsToRemove = ["Properties", "Floors", "Units and sft", "Tenants", "Leases", "Owners", "Assets", "Vendors", "Reports"];
      return {
        ...group,
        items: group.items.filter(item => !itemsToRemove.includes(item.name))
      };
    }
    return group;
  }).filter(group => group.items.length > 0);

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <i className="hgi-stroke hgi-shield-01"></i>
        </div>
        <span className={styles.brandName}>PMS Global</span>
      </div>

      {/* Navigation */}
      <nav className={styles.navSection}>
        {menuGroups.map((group) => (
          <div key={group.label} className={styles.navGroup}>
            <p className={styles.navLabel}>{group.label}</p>
            <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.path);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.path}
                      className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                    >
                      <i className={`hgi-stroke ${item.icon} ${styles.navIcon}`}></i>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

    </aside>
  );
}
