"use client";
import React, { useState } from "react";
import OverviewTab from "./tabs/OverviewTab";
import AgreementDetailsTab from "./tabs/AgreementDetailsTab";
import PaymentsTab from "./tabs/PaymentsTab";
import PermissionsTab from "./tabs/PermissionsTab";
import ActivityLogTab from "./tabs/ActivityLogTab";
import { formatRole } from "@/utils/format";

const TABS = ["Overview", "Agreement Details", "Payments", "Permissions", "Activity Log"] as const;
type TabName = (typeof TABS)[number];

interface UserDetailViewProps {
  viewUser: any;
  agreementData: any;
  loadingAgreement: boolean;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  onBack: () => void;
  onStartEditing: () => void;
  onSuspend: () => void;
  onResetPassword: () => void;
  onRecordPayment: (agr: any, amount: string) => void;
  generateInstallments: (user: any, agr: any, payments: any[]) => any[];
  getPropertyNames: (ids: string[]) => string;
  getFloorNames: (ids: string[]) => string;
  getAgreementDuration: (start: string, end: string) => string;
  getNextDueDate: (day: number) => string;
}

export default function UserDetailView({
  viewUser,
  agreementData,
  loadingAgreement,
  showPassword,
  setShowPassword,
  onBack,
  onStartEditing,
  onSuspend,
  onResetPassword,
  onRecordPayment,
  generateInstallments,
  getPropertyNames,
  getFloorNames,
  getAgreementDuration,
  getNextDueDate,
}: UserDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabName>("Overview");

  const isSuspended = viewUser.agreementStatus === "Suspended";
  const initials = viewUser.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-4 h-100 overflow-y-auto no-scrollbar">

      {/* ── Top Bar: Back + Actions ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          onClick={onBack}
          className="btn btn-link p-0 text-dark d-flex align-items-center gap-2"
          style={{ textDecoration: "none", fontSize: "0.9rem" }}
        >
          <i className="hgi-stroke hgi-arrow-left-01 fs-5 fw-bold" />
          <span className="fw-semibold text-muted">Access Management</span>
          <span className="text-muted">/</span>
          <span className="fw-semibold text-dark">{viewUser.name}</span>
        </button>

        <div className="d-flex gap-2">
          <button
            onClick={onStartEditing}
            className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2"
            style={{ borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, border: "1px solid #cbd5e1" }}
          >
            <i className="hgi-stroke hgi-pencil-line-01" /> Edit User
          </button>
          <div className="dropdown">
            <button
              className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 dropdown-toggle"
              data-bs-toggle="dropdown"
              style={{ borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, border: "1px solid #cbd5e1" }}
            >
              More Actions
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3 p-2">
              <li>
                <button className="dropdown-item py-2 rounded" onClick={onResetPassword}>
                  <i className="hgi-stroke hgi-key-01 me-2 text-muted" /> Reset Password
                </button>
              </li>
              <li>
                <button className="dropdown-item py-2 rounded text-danger" onClick={onSuspend}>
                  <i className="hgi-stroke hgi-user-block me-2" />
                  {isSuspended ? "Activate Account" : "Suspend Account"}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Profile Header ── */}
      <div className="d-flex align-items-center gap-4 mb-4">
        <div className="profile-avatar">
          {initials}
          <span className="active-badge-dot" style={{ backgroundColor: isSuspended ? "#ef4444" : "#22c55e" }} />
        </div>
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
            <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "1.4rem" }}>{viewUser.name}</h4>
            <span className="role-badge d-flex align-items-center gap-1">
              <i className="hgi-stroke hgi-user-shield-01 text-primary" /> {formatRole(viewUser.role)}
            </span>
            <span
              className="status-badge-active"
              style={{
                backgroundColor: isSuspended ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                color: isSuspended ? "#ef4444" : "#22c55e",
              }}
            >
              {viewUser.agreementStatus || "Active"}
            </span>
          </div>
          <div className="d-flex flex-column gap-1 text-muted" style={{ fontSize: "0.85rem" }}>
            <span className="d-flex align-items-center gap-2">
              <i className="hgi-stroke hgi-mail-01" /> {viewUser.email}
            </span>
            <span className="d-flex align-items-center gap-2">
              <i className="hgi-stroke hgi-smart-phone-01" /> {viewUser.phoneNumber || "N/A"}
            </span>
            <span className="d-flex align-items-center gap-2">
              <i className="hgi-stroke hgi-location-01" /> {viewUser.address || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bento Stats Panel ── */}
      {agreementData?.summary && (
        <div className="row g-3 mb-4">
          {[
            { label: "Total Agreement Value", value: agreementData.summary.totalAmount, color: "text-dark", icon: "hgi-invoice" },
            { label: "Amount Paid", value: agreementData.summary.totalPaid, color: "text-success", icon: "hgi-checkmark-circle-02" },
            { label: "Pending Balance", value: agreementData.summary.totalPending, color: "text-danger", icon: "hgi-alert-02" },
            { label: "Agreement Type", value: viewUser.paymentType || "Monthly", color: "text-primary", icon: "hgi-agreement", isString: true },
          ].map((s, i) => (
            <div key={i} className="col-12 col-md-3">
              <div className="bg-white border p-3 d-flex align-items-center gap-3 rounded-4">
                <div className="d-flex align-items-center justify-content-center rounded-3 bg-light" style={{ width: "44px", height: "44px" }}>
                  <i className={`hgi-stroke ${s.icon} ${s.color} fs-4`} />
                </div>
                <div>
                  <div className="text-muted small fw-medium">{s.label}</div>
                  <div className={`fw-bold ${s.color}`} style={{ fontSize: "1.1rem" }}>
                    {s.isString ? s.value : `₹ ${(s.value || 0).toLocaleString()}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div className="bg-white border rounded-4 mb-4 px-3 d-flex flex-wrap flex-row gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-item py-3 ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "Overview" && (
        <OverviewTab
          viewUser={viewUser}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          startEditing={onStartEditing}
          getPropertyNames={getPropertyNames}
          getFloorNames={getFloorNames}
          getAgreementDuration={getAgreementDuration}
          getNextDueDate={getNextDueDate}
        />
      )}

      {activeTab === "Agreement Details" && (
        <AgreementDetailsTab
          viewUser={viewUser}
          agreementData={agreementData}
          loadingAgreement={loadingAgreement}
          getPropertyNames={getPropertyNames}
          getFloorNames={getFloorNames}
        />
      )}

      {activeTab === "Payments" && (
        <PaymentsTab
          viewUser={viewUser}
          agreementData={agreementData}
          loadingAgreement={loadingAgreement}
          generateInstallments={generateInstallments}
          onRecordPayment={onRecordPayment}
        />
      )}

      {activeTab === "Permissions" && <PermissionsTab viewUser={viewUser} />}

      {activeTab === "Activity Log" && (
        <ActivityLogTab viewUser={viewUser} agreementData={agreementData} />
      )}
    </div>
  );
}
