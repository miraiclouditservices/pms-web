"use client";
import React from "react";

interface PermissionsTabProps {
  viewUser: any;
}

const PERMISSION_MATRIX = [
  {
    name: "System Login",
    desc: "Authenticate into the admin portal.",
    roles: ["ALL"],
  },
  {
    name: "Provision Accounts",
    desc: "Create and provision subordinate user accounts.",
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Financial Control",
    desc: "Record agreement payments and manage transactional records.",
    roles: ["SUPER_ADMIN", "OFFICE_OWNER"],
  },
  {
    name: "Helpdesk & AMC Response",
    desc: "Resolve complaints and coordinate maintenance.",
    roles: ["SUPER_ADMIN", "FLOOR_ADMIN", "STAFF_ADMIN"],
  },
  {
    name: "Visitor Approval",
    desc: "Approve gate passes and view visitor logs.",
    roles: ["ALL"],
  },
  {
    name: "Spatial Configuration",
    desc: "Add properties, floors, and units to the database.",
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Agreement Management",
    desc: "Create and manage tenant agreements.",
    roles: ["SUPER_ADMIN", "FLOOR_ADMIN"],
  },
  {
    name: "Reports Access",
    desc: "View collection and due management reports.",
    roles: ["SUPER_ADMIN", "FLOOR_ADMIN"],
  },
];

export default function PermissionsTab({ viewUser }: PermissionsTabProps) {
  const isActive = (roles: string[]) =>
    roles.includes("ALL") || roles.includes(viewUser.role);

  return (
    <div className="detail-card text-start">
      <div className="detail-card-header">
        <div className="d-flex align-items-center gap-2">
          <i className="hgi-stroke hgi-shield-lock text-primary fs-5" />
          <h5 className="fw-bold mb-0 text-dark">Role Clearances & Permissions</h5>
        </div>
        <span
          className="badge rounded-pill px-3 py-1 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25"
          style={{ fontSize: "0.75rem", fontWeight: 700 }}
        >
          {viewUser.role}
        </span>
      </div>
      <div className="row g-3 p-2">
        {PERMISSION_MATRIX.map((perm, idx) => {
          const active = isActive(perm.roles);
          return (
            <div key={idx} className="col-md-6">
              <div
                className="d-flex justify-content-between align-items-center p-3 rounded-3 border"
                style={{
                  backgroundColor: active ? "rgba(1, 74, 173, 0.03)" : "#f8fafc",
                  borderColor: active ? "rgba(1, 74, 173, 0.15)" : "#e2e8f0",
                }}
              >
                <div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: "0.85rem" }}>
                    {perm.name}
                  </h6>
                  <p className="text-muted small mb-0" style={{ fontSize: "0.75rem", maxWidth: "260px" }}>
                    {perm.desc}
                  </p>
                </div>
                <span
                  className={`badge rounded-pill px-3 py-1 flex-shrink-0 ms-2 ${
                    active
                      ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                      : "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25"
                  }`}
                  style={{ fontSize: "0.7rem", fontWeight: 700 }}
                >
                  {active ? "✓ Authorized" : "Restricted"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
