"use client";

import styles from "@/styles/modules/Dashboard.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/utils/api";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    activeLeaseCount: 0,
    pendingComplaints: 0,
    visitorsToday: 0,
    amcExpiryAlerts: 0,
    upcomingBookings: 0,
    revenueSummary: 0
  });

  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);

  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/metrics');
        if (response.success) {
          setMetrics(response.data.metrics);
          setRecentComplaints(response.data.recentComplaints);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard metrics:", err);
      }
    };

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

    fetchDashboardData();
  }, []);

  const stats = [
    ...(user?.role === "Admin" ? [
      { label: "Total Properties", value: metrics.totalProperties, icon: "bi-building", color: "var(--primary)" },
      { label: "Total Units", value: metrics.totalUnits, icon: "bi-grid-3x3-gap", color: "#3B82F6" },
      { label: "Occupied Units", value: metrics.occupiedUnits, icon: "bi-person-check-fill", color: "#10B981" },
      { label: "Vacant Units", value: metrics.vacantUnits, icon: "bi-house-x", color: "#F59E0B" }
    ] : []),
    { label: "Active Leases", value: metrics.activeLeaseCount, icon: "bi-file-earmark-text", color: "#6366F1" },
    { label: "Pending Complaints", value: metrics.pendingComplaints, icon: "bi-exclamation-triangle", color: "#EF4444" },
    { label: "Visitors Today", value: metrics.visitorsToday, icon: "bi-person-badge", color: "#8B5CF6" },
    ...(user?.role === "Admin" ? [
      { label: "AMC Alerts", value: metrics.amcExpiryAlerts, icon: "bi-alarm", color: "#EC4899" }
    ] : []),
    { label: "Upcoming Bookings", value: metrics.upcomingBookings, icon: "bi-calendar-event", color: "#06B6D4" },
    { label: "Revenue", value: `₹${(metrics.revenueSummary / 100000).toFixed(1)}L`, icon: "bi-cash-stack", color: "#10B981" },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h2>System Overview</h2>
          <p>Real-time analytics and operational performance metrics.</p>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <div className={styles.statCard} key={idx}>
            <div className={styles.statHeader}>
              <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <i className={`bi ${stat.icon}`}></i>
              </div>
            </div>
            <p className={styles.statLabel}>{stat.label}</p>
            <h3 className={styles.statValue}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        {/* Helpdesk Panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h5 className={styles.panelTitle}>Pending Complaints</h5>
            <Link href="/admin/helpdesk" className="btn btn-primary btn-sm rounded-pill px-3">View All</Link>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Ticket ID</th>
                    <th className={styles.th}>Description</th>
                    <th className={styles.th}>Priority</th>
                    <th className={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.length > 0 ? (
                    recentComplaints.map((issue) => (
                      <tr key={issue.id}>
                        <td className={styles.td}><span className="fw-bold text-emerald">{issue.ticketNumber}</span></td>
                        <td className={styles.td}>{issue.natureOfComplaint}</td>
                        <td className={styles.td}>
                          <span className={`badge bg-${issue.priority === 'High' ? 'danger' : 'warning'} bg-opacity-10 text-${issue.priority === 'High' ? 'danger' : 'warning'} rounded-pill px-3`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={`badge rounded-pill px-2 py-1 ${
                            issue.status === 'Open' ? 'bg-danger text-white' : 
                            issue.status === 'In Progress' ? 'bg-warning text-dark' : 
                            'bg-success text-white'
                          }`} style={{ fontSize: '0.65rem' }}>
                            {issue.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-5 text-muted">
                        <i className="bi bi-check2-circle mb-2 d-block" style={{ fontSize: '1.5rem' }}></i>
                        <span className="small">No pending complaints at the moment.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
