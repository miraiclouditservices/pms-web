"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/modules/Header.module.css";
import Link from "next/link";

export default function Header() {
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
    ? (user.role === "Admin" ? "Super Admin" : user.role === "Owner" ? "Office Owner" : user.role) 
    : "Super Admin";
  const avatarChar = displayName ? displayName.charAt(0).toUpperCase() : "A";
  return (
    <header className={styles.header}>
      {/* Left: Empty spacer */}
      <div className="d-flex align-items-center gap-3 flex-grow-1">
      </div>

      {/* Right: Actions */}
      <div className={styles.actions}>
        <div className="dropdown">
          <button className={styles.quickAction} type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i className="bi bi-plus-lg"></i>
            <span>Quick Action</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-xl mt-2 p-2">
            {(!user || user.role === "Admin") && (
              <li>
                <Link className="dropdown-item rounded-lg py-2" href="/admin/properties?action=add">
                  <i className="bi bi-building me-2"></i>Add Property
                </Link>
              </li>
            )}
            <li>
              <Link className="dropdown-item rounded-lg py-2" href="/admin/helpdesk?action=add">
                <i className="bi bi-ticket-perforated me-2"></i>Create Ticket
              </Link>
            </li>
            {(!user || user.role === "Admin") && (
              <li>
                <Link className="dropdown-item rounded-lg py-2" href="/admin/people?action=add">
                  <i className="bi bi-person-plus me-2"></i>Invite User
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button className={styles.actionButton}>
            <i className="bi bi-bell fs-5"></i>
            <span className={styles.badge}></span>
          </button>
          
          <button className={styles.actionButton}>
            <i className="bi bi-question-circle fs-5"></i>
          </button>
          
          <div className="ms-2 ps-3 border-start">
            <div className="d-flex align-items-center gap-2">
              <div className="text-end d-none d-xl-block">
                <p className="mb-0 fw-bold small" style={{ lineHeight: 1.2 }}>{displayName}</p>
                <p className="mb-0 text-muted small" style={{ fontSize: '0.7rem' }}>{displayRole}</p>
              </div>
              <div className={styles.actionButton} style={{ background: 'var(--bg-app)', fontWeight: 'bold', color: '#014aad', fontSize: '0.85rem' }}>
                {avatarChar}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
