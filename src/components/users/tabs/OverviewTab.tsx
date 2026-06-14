"use client";
import React from "react";

interface OverviewTabProps {
  viewUser: any;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  startEditing: () => void;
  getPropertyNames: (ids: string[]) => string;
  getFloorNames: (ids: string[]) => string;
  getAgreementDuration: (start: string, end: string) => string;
  getNextDueDate: (day: number) => string;
}

export default function OverviewTab({
  viewUser,
  showPassword,
  setShowPassword,
  startEditing,
  getPropertyNames,
  getFloorNames,
  getAgreementDuration,
  getNextDueDate,
}: OverviewTabProps) {
  return (
    <div className="row g-4">
      {/* User Information Card */}
      <div className="col-lg-6 col-md-12">
        <div className="detail-card h-100">
          <div className="detail-card-header">
            <div className="d-flex align-items-center gap-2">
              <i className="hgi-stroke hgi-user text-primary fs-5" />
              <h5 className="fw-bold mb-0 text-dark">User Information</h5>
            </div>
            <button
              onClick={startEditing}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 px-3 py-1 rounded-pill"
              style={{ fontSize: "0.8rem" }}
            >
              <i className="hgi-stroke hgi-pencil-line-01 me-1" /> Edit Profile
            </button>
          </div>
          <div className="row">
            {[
              { label: "Full Name", value: viewUser.name },
              { label: "Alternate Contact", value: viewUser.emergencyNumber || "N/A" },
              { label: "Primary Role", value: viewUser.role },
              { label: "Address", value: viewUser.address || "N/A" },
              { label: "Official Email", value: viewUser.email },
              {
                label: "Password",
                value: (
                  <div className="d-flex align-items-center gap-2">
                    <span>{showPassword ? "N/A (Write-Only)" : "••••••••"}</span>
                    <i
                      className={`hgi-stroke ${showPassword ? "hgi-view" : "hgi-view-off-slash"} text-muted`}
                      style={{ fontSize: "1.1rem", cursor: "pointer" }}
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </div>
                ),
              },
              { label: "Mobile Number", value: viewUser.phoneNumber || "N/A" },
            ].map((item, i) => (
              <div key={i} className="col-md-6 detail-grid-item">
                <div className="detail-grid-label">{item.label}</div>
                <div className="detail-grid-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agreement Summary Card */}
      <div className="col-lg-6 col-md-12">
        <div className="detail-card h-100">
          <div className="detail-card-header">
            <div className="d-flex align-items-center gap-2">
              <i className="hgi-stroke hgi-document-text text-purple fs-5" />
              <h5 className="fw-bold mb-0 text-dark">Agreement Summary</h5>
            </div>
          </div>
          <div className="row">
            {[
              {
                label: "Agreement Status",
                value: (
                  <span
                    className="badge rounded-pill px-3 py-1 bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {viewUser.agreementStatus || "Active"}
                  </span>
                ),
              },
              {
                label: "Start Date",
                value: viewUser.floorAssignmentStartDate
                  ? new Date(viewUser.floorAssignmentStartDate).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric",
                    })
                  : "N/A",
              },
              { label: "Property", value: getPropertyNames(viewUser.assignedProperties) },
              {
                label: "End Date",
                value: viewUser.floorAssignmentEndDate
                  ? new Date(viewUser.floorAssignmentEndDate).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric",
                    })
                  : "N/A",
              },
              { label: "Floor", value: getFloorNames(viewUser.assignedFloors) },
              {
                label: "Duration",
                value: getAgreementDuration(
                  viewUser.floorAssignmentStartDate,
                  viewUser.floorAssignmentEndDate
                ),
              },
              { label: "Payment Type", value: viewUser.paymentType || "Monthly" },
              {
                label: "Monthly Amount",
                value: `₹ ${(viewUser.monthlyManagementAmount || 0).toLocaleString()}`,
              },
              {
                label: "Next Due Date",
                value: (
                  <span className="text-primary fw-bold">
                    {getNextDueDate(viewUser.paymentDueDay)}
                  </span>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="col-md-6 detail-grid-item">
                <div className="detail-grid-label">{item.label}</div>
                <div className="detail-grid-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
