"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/modules/Header.module.css";
import Link from "next/link";
import LogoutModal from "@/components/dashboard/LogoutModal";
import { api } from "@/utils/api";

export default function Header() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data);
        const unread = res.data.filter((n: any) => !n.readStatus).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`, {});
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, readStatus: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.get('/notifications?markAsRead=true');
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

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
  return (
    <header className={styles.header}>
      {/* Left: Empty spacer */}
      <div className="d-flex align-items-center gap-3 flex-grow-1">
      </div>

      {/* Right: Actions */}
      <div className={styles.actions}>


        <div className="d-flex align-items-center gap-2">
          <div className="dropdown">
            <button 
              className={styles.actionButton} 
              type="button" 
              data-bs-toggle="dropdown" 
              aria-expanded="false"
              onClick={fetchNotifications}
            >
              <i className="bi bi-bell fs-5"></i>
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-xl mt-2 p-0" style={{ width: '320px', maxHeight: '400px', overflow: 'hidden', zIndex: 1050 }}>
              <li className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light">
                <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button className="btn btn-link p-0 text-primary small text-decoration-none fw-bold" style={{ fontSize: '0.75rem' }} onClick={handleMarkAllAsRead}>
                    Mark all read
                  </button>
                )}
              </li>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <li key={notif._id} className={`p-3 border-bottom d-flex gap-2 align-items-start ${!notif.readStatus ? 'bg-primary bg-opacity-10' : ''}`} style={{ transition: 'background-color 0.2s', whiteSpace: 'normal' }}>
                      <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1`} style={{ width: '28px', height: '28px', backgroundColor: notif.type === 'Alert' ? '#fef2f2' : notif.type === 'Reminder' ? '#fffbeb' : '#f0fdf4' }}>
                        <i className={`bi ${notif.type === 'Alert' ? 'bi-exclamation-triangle text-danger' : notif.type === 'Reminder' ? 'bi-calendar-check text-warning' : 'bi-info-circle text-success'}`} style={{ fontSize: '0.85rem' }}></i>
                      </div>
                      <div style={{ minWidth: 0, flexGrow: 1 }}>
                        <div className="d-flex align-items-start justify-content-between gap-1">
                          <p className="mb-0 fw-bold text-dark text-truncate" style={{ fontSize: '0.8rem' }}>{notif.title}</p>
                          {!notif.readStatus && (
                            <button className="btn btn-link p-0 text-muted" title="Mark as read" onClick={(e) => handleMarkAsRead(notif._id, e)}>
                              <i className="bi bi-check-circle-fill text-primary" style={{ fontSize: '0.85rem' }}></i>
                            </button>
                          )}
                        </div>
                        <p className="mb-1 text-muted text-wrap" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>{notif.message}</p>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>{new Date(notif.createdAt).toLocaleDateString('en-GB')} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-center text-muted">
                    <i className="bi bi-bell-slash d-block fs-3 mb-2 opacity-50"></i>
                    <span className="small">No notifications found</span>
                  </li>
                )}
              </div>
            </ul>
          </div>
          
          <button className={styles.actionButton}>
            <i className="bi bi-question-circle fs-5"></i>
          </button>
          
          <div className="ms-2 ps-3 border-start dropdown">
            <button 
              className="d-flex align-items-center gap-2 border-0 bg-transparent p-0 shadow-none text-start align-middle" 
              type="button" 
              data-bs-toggle="dropdown" 
              aria-expanded="false"
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <div className="text-end d-none d-xl-block">
                <p className="mb-0 fw-bold small" style={{ lineHeight: 1.2, color: 'var(--text-main)' }}>{displayName}</p>
                <p className="mb-0 text-muted small" style={{ fontSize: '0.7rem' }}>{displayRole}</p>
              </div>
              <div className={styles.actionButton} style={{ background: 'var(--bg-app)', fontWeight: 'bold', color: '#014aad', fontSize: '0.85rem', margin: 0 }}>
                {avatarChar}
              </div>
            </button>

            <ul className={`dropdown-menu dropdown-menu-end shadow-lg ${styles.profileDropdown}`} style={{ zIndex: 1050 }}>
              {/* Header */}
              <li className={styles.profileDropdownHeader}>
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white shadow-sm" 
                       style={{ background: 'linear-gradient(135deg, #014aad 0%, #002d6a 100%)', width: '38px', height: '38px', fontSize: '0.9rem' }}>
                    {avatarChar}
                  </div>
                  <div style={{ minWidth: 0, flexGrow: 1 }}>
                    <p className="mb-0 fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>{displayName}</p>
                    <p className="mb-0 text-muted small text-truncate" style={{ fontSize: '0.7rem' }}>{displayRole}</p>
                  </div>
                </div>
              </li>

              {/* Items */}
              <li>
                <Link className={styles.profileDropdownItem} href="/admin/settings">
                  <i className="bi bi-person-gear fs-5 text-primary"></i>
                  <span>Profile Settings</span>
                </Link>
              </li>

              <li>
                <Link className={styles.profileDropdownItem} href="/admin/settings?tab=security">
                  <i className="bi bi-shield-lock fs-5 text-warning"></i>
                  <span>Personal Lock / Security</span>
                </Link>
              </li>

              <li><hr className="dropdown-divider opacity-10" /></li>

              <li>
                <button 
                  className={`${styles.profileDropdownItem} ${styles.profileDropdownItemDanger}`}
                  onClick={() => setIsLogoutModalOpen(true)}
                >
                  <i className="bi bi-box-arrow-right fs-5"></i>
                  <span className="fw-bold">Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={handleLogout} 
      />
    </header>
  );
}
