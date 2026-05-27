"use client";

import React from 'react';
import styles from "@/styles/modules/Properties.module.css";

export default function RolesPage() {
  const roles = [
    {
      name: "Super Admin",
      description: "Global system administrator with unrestricted access.",
      color: "#014aad", // Emerald
      bgClass: "bg-success bg-opacity-10 text-success",
      permissions: [
        "Create & Manage Properties",
        "Create & Manage Users",
        "Full Financial Access",
        "System Configuration"
      ]
    },
    {
      name: "Floor Admin",
      description: "Manages day-to-day operations for specific building floors.",
      color: "#3B82F6", // Blue
      bgClass: "bg-primary bg-opacity-10 text-primary",
      permissions: [
        "Manage Floor Layouts",
        "Assign Office Owners",
        "View Floor Revenue",
        "Manage Maintenance"
      ]
    },
    {
      name: "Office Owner",
      description: "Tenant or entity that owns/rents a specific office space.",
      color: "#F59E0B", // Amber
      bgClass: "bg-warning bg-opacity-10 text-warning",
      permissions: [
        "View Assigned Units",
        "Manage Own Staff",
        "Pay Lease Invoices",
        "Submit Helpdesk Tickets"
      ]
    },
    {
      name: "Staff Admin",
      description: "Operational staff managing visitors and daily tasks.",
      color: "#8B5CF6", // Purple
      bgClass: "bg-info bg-opacity-10 text-info",
      permissions: [
        "Manage Visitor Logs",
        "Handle Material Gatepasses",
        "View Booking Calendars",
        "Resolve Helpdesk Tickets"
      ]
    },
    {
      name: "Tenant",
      description: "Individual occupant within an Office Owner's space.",
      color: "#64748B", // Slate
      bgClass: "bg-secondary bg-opacity-10 text-secondary",
      permissions: [
        "View Personal Lease",
        "Submit Maintenance Requests",
        "Access Building Updates"
      ]
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>Roles & Permissions</h2>
          <p>Global security architecture and access control matrices.</p>
        </div>
      </div>

      <div className="row g-4 mt-2">
        {roles.map((role) => (
          <div key={role.name} className="col-lg-6">
            <div className="card shadow-sm border-0 rounded-4 h-100 p-4" style={{ backgroundColor: '#ffffff' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className={`rounded-circle d-flex align-items-center justify-content-center ${role.bgClass}`} style={{ width: '50px', height: '50px' }}>
                    <i className="bi bi-shield-check" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <h4 className="fw-bold mb-1">{role.name}</h4>
                    <span className={`badge rounded-pill px-3 py-1 ${role.bgClass}`} style={{ fontSize: '0.75rem' }}>Active Role</span>
                  </div>
                </div>
              </div>
              
              <p className="text-muted small mb-4">{role.description}</p>
              
              <hr className="opacity-10 mb-4" />
              
              <h6 className="fw-bold mb-3 small text-uppercase text-muted">Access Privileges</h6>
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                {role.permissions.map((perm, idx) => (
                  <li key={idx} className="d-flex align-items-center gap-2 small fw-bold text-dark">
                    <i className="bi bi-check-circle-fill" style={{ color: role.color }}></i>
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
