"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/styles/modules/Sidebar.module.css";
import LogoutModal from "@/components/dashboard/LogoutModal";

export default function Sidebar() {
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
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

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    console.log("Logging out...");
    window.location.href = "/login";
  };

  const displayName = user ? user.name : "Admin User";
  const displayRole = user 
    ? (user.role === "Admin" ? "Super Admin" : user.role === "Owner" ? "Office Owner" : user.role) 
    : "Super Admin";
  const avatarChar = displayName ? displayName.charAt(0).toUpperCase() : "A";

  const menuGroups = [
    {
      label: "Main",
      items: [
        { name: "Dashboard", path: "/admin/dashboard", icon: "bi-grid-1x2-fill" },
        { name: user?.role === "Owner" ? "My Office" : "Properties", path: "/admin/properties", icon: "bi-building-fill" },
        ...(user?.role === "Admin" ? [
          { name: "Owners", path: "/admin/owners", icon: "bi-people-fill" }
        ] : []),
        { name: "Leases", path: "/admin/leases", icon: "bi-file-earmark-text-fill" },
      ]
    },
    {
      label: "Operations",
      items: [
        ...(user?.role === "Admin" ? [
          { name: "Assets", path: "/admin/assets", icon: "bi-box-seam-fill" },
          { name: "AMC", path: "/admin/amc", icon: "bi-calendar-check-fill" },
          { name: "Vendors", path: "/admin/vendors", icon: "bi-truck" },
        ] : []),
        { name: "Visitors", path: "/admin/visitors", icon: "bi-person-badge-fill" },
      ]
    },
    {
      label: "Management",
      items: [
        { name: "Materials", path: "/admin/materials", icon: "bi-cart-fill" },
        { name: "Helpdesk", path: "/admin/helpdesk", icon: "bi-headset" },
        { name: "Bookings", path: "/admin/bookings", icon: "bi-calendar-event-fill" },
      ]
    },
    ...(user?.role === "Admin" ? [
      {
        label: "Intelligence",
        items: [
          { name: "Reports", path: "/admin/reports", icon: "bi-bar-chart-line-fill" },
          { name: "Settings", path: "/admin/settings", icon: "bi-gear-wide-connected" },
        ]
      }
    ] : [])
  ];

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <i className="bi bi-shield-check"></i>
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
                      <i className={`bi ${item.icon} ${styles.navIcon}`}></i>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className={styles.userProfile}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>{avatarChar}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{displayName}</p>
            <p className={styles.userRole}>{displayRole}</p>
          </div>
          <button 
            className="btn btn-link text-muted p-0 shadow-none"
            onClick={() => setIsLogoutModalOpen(true)}
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>

      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={handleLogout} 
      />
    </aside>
  );
}
