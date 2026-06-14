"use client";
import React from "react";

interface AgreementDetailsTabProps {
  viewUser: any;
  agreementData: any;
  loadingAgreement: boolean;
  getPropertyNames: (ids: string[]) => string;
  getFloorNames: (ids: string[]) => string;
}

export default function AgreementDetailsTab({
  viewUser,
  agreementData,
  loadingAgreement,
  getPropertyNames,
  getFloorNames,
}: AgreementDetailsTabProps) {
  const activeAgr = agreementData?.agreements?.[0] || null;
  const startStr = activeAgr?.startDate || viewUser?.floorAssignmentStartDate;
  const endStr = activeAgr?.endDate || viewUser?.floorAssignmentEndDate;

  const term = startStr && endStr
    ? (() => {
        const s = new Date(startStr);
        const e = new Date(endStr);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return 12;
        return Math.max((e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1, 1);
      })()
    : 12;

  const totalAmount = activeAgr?.totalAmount || viewUser?.totalAgreementAmount || ((viewUser?.monthlyManagementAmount || 0) * term);
  const paymentType = activeAgr?.paymentType || viewUser?.paymentType || "Monthly";
  const dueDay = activeAgr?.paymentDueDay || viewUser?.paymentDueDay || 5;
  const totalPaid = activeAgr?.totalPaid || 0;
  const pendingAmount = activeAgr?.pendingAmount || Math.max(0, totalAmount - totalPaid);
  const intervalMonths = paymentType.includes("Quarterly") ? 3 : paymentType.includes("Half-Yearly") ? 6 : paymentType.includes("Yearly") ? 12 : 1;
  const numInst = Math.max(1, Math.ceil(term / intervalMonths));
  const instAmount = Math.ceil(totalAmount / numInst);
  const progress = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;

  if (loadingAgreement) {
    return (
      <div className="text-center py-5 text-muted">
        <span className="spinner-border spinner-border-sm me-2" />Loading agreement data...
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4 text-start">
      <div className="row g-4">
        {/* Configuration Card */}
        <div className="col-lg-6 col-md-12">
          <div className="detail-card h-100">
            <div className="detail-card-header">
              <div className="d-flex align-items-center gap-2">
                <i className="hgi-stroke hgi-agreement text-primary fs-5" />
                <h5 className="fw-bold mb-0 text-dark">Agreement Configuration</h5>
              </div>
            </div>
            <div className="row">
              {[
                { label: "Company / Entity Name", value: viewUser.companyName || "Individual" },
                { label: "Tenant Type", value: viewUser.tenantType || "Individual" },
                { label: "GST / PAN Number", value: viewUser.gstPan || "—" },
                { label: "Payment Type", value: <span className="fw-semibold text-primary">{paymentType}</span> },
                {
                  label: "Start Date",
                  value: startStr ? new Date(startStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
                },
                {
                  label: "End Date",
                  value: endStr ? new Date(endStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
                },
                { label: "Contract Duration", value: `${term} months` },
                { label: "Payment Due Day", value: `Day ${dueDay} of every month` },
                { label: "Assigned Property", value: getPropertyNames(viewUser.assignedProperties) },
                { label: "Assigned Floor", value: getFloorNames(viewUser.assignedFloors) },
              ].map((item, i) => (
                <div key={i} className="col-md-6 detail-grid-item">
                  <div className="detail-grid-label">{item.label}</div>
                  <div className="detail-grid-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="col-lg-6 col-md-12">
          <div className="detail-card h-100">
            <div className="detail-card-header">
              <div className="d-flex align-items-center gap-2">
                <i className="hgi-stroke hgi-wallet-01 text-success fs-5" />
                <h5 className="fw-bold mb-0 text-dark">Financial Summary</h5>
              </div>
            </div>
            <div className="d-flex flex-column gap-3 mt-1">
              {[
                { label: "Total Agreement Amount", value: `₹ ${totalAmount.toLocaleString()}`, cls: "text-dark" },
                { label: "Installment Amount", value: `₹ ${instAmount.toLocaleString()}`, cls: "text-primary" },
                { label: "Total Paid", value: `₹ ${totalPaid.toLocaleString()}`, cls: "text-success" },
                { label: "Pending Balance", value: `₹ ${pendingAmount.toLocaleString()}`, cls: "text-danger" },
              ].map((row, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                  <span className="text-muted" style={{ fontSize: "0.9rem" }}>{row.label}</span>
                  <strong className={row.cls} style={{ fontSize: "1.05rem" }}>{row.value}</strong>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Payment Progress</span>
                <span>{progress}% Cleared</span>
              </div>
              <div className="progress" style={{ height: "8px", borderRadius: "99px" }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${progress}%`, borderRadius: "99px" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
