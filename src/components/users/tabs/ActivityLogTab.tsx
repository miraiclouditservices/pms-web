"use client";
import React from "react";

interface ActivityLogTabProps {
  viewUser: any;
  agreementData: any;
}

interface TimelineEvent {
  id: string;
  color: string;
  icon: string;
  title: string;
  date: string;
  description: React.ReactNode;
}

export default function ActivityLogTab({ viewUser, agreementData }: ActivityLogTabProps) {
  const events: TimelineEvent[] = [];

  // Account creation
  events.push({
    id: "account-created",
    color: "#22c55e",
    icon: "hgi-user-add-01",
    title: "Account Provisioned & Activated",
    date: viewUser.createdAt
      ? new Date(viewUser.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "—",
    description: (
      <>
        System access granted for <strong>{viewUser.name}</strong> with role{" "}
        <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-1">{viewUser.role}</span>.
      </>
    ),
  });

  // Floor assignment
  if (viewUser.assignedFloors?.length > 0) {
    events.push({
      id: "spatial-sync",
      color: "#014aad",
      icon: "hgi-building-03",
      title: "Spatial Mappings Synchronized",
      date: viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleDateString("en-GB") : "—",
      description: (
        <>
          Linked to <strong>{viewUser.assignedFloors.length} floor(s)</strong> and{" "}
          <strong>{viewUser.assignedUnits?.length || 0} unit(s)</strong>.
        </>
      ),
    });
  }

  // Agreement events
  agreementData?.agreements?.forEach((agr: any) => {
    events.push({
      id: agr._id,
      color: "#0ea5e9",
      icon: "hgi-agreement",
      title: `Agreement Created — ${agr.agreementNumber}`,
      date: agr.createdAt
        ? new Date(agr.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
      description: (
        <>
          <strong>{agr.paymentType}</strong> agreement for ₹{agr.totalAmount?.toLocaleString()} from{" "}
          {agr.startDate ? new Date(agr.startDate).toLocaleDateString("en-GB") : "?"} to{" "}
          {agr.endDate ? new Date(agr.endDate).toLocaleDateString("en-GB") : "?"}. Status:{" "}
          <strong>{agr.status}</strong>.
        </>
      ),
    });
  });

  // Payment events
  const allPayments = agreementData?.agreements
    ?.flatMap((agr: any) => agr.payments || [])
    .sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()) || [];

  allPayments.forEach((p: any) => {
    events.push({
      id: p._id,
      color: "#8b5cf6",
      icon: "hgi-wallet-01",
      title: `Payment Recorded — ${p.receiptNumber || "N/A"}`,
      date: p.paymentDate
        ? new Date(p.paymentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
      description: (
        <>
          ₹{(p.amountPaid || p.amount || 0).toLocaleString()} paid via <strong>{p.paymentMode}</strong>
          {p.transactionRef ? ` · Ref: ${p.transactionRef}` : ""}. {p.notes || ""}
        </>
      ),
    });
  });

  return (
    <div className="detail-card text-start">
      <div className="detail-card-header">
        <div className="d-flex align-items-center gap-2">
          <i className="hgi-stroke hgi-activity-01 text-primary fs-5" />
          <h5 className="fw-bold mb-0 text-dark">Audit Trails & Activity Log</h5>
        </div>
        <span className="text-muted small">{events.length} events</span>
      </div>
      <div className="px-3 py-2">
        {events.length === 0 ? (
          <div className="text-center text-muted small py-4">No activity recorded yet.</div>
        ) : (
          <div className="timeline-container position-relative py-3">
            <div
              className="timeline-line position-absolute"
              style={{ left: "19px", top: 0, bottom: 0, width: "2px", backgroundColor: "#e2e8f0", zIndex: 1 }}
            />
            {events.map((evt) => (
              <div key={evt.id} className="timeline-item d-flex gap-4 mb-4 position-relative" style={{ zIndex: 2 }}>
                <div
                  className="timeline-icon rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                  style={{ width: "40px", height: "40px", backgroundColor: evt.color, border: "4px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
                >
                  <i className={`hgi-stroke ${evt.icon}`} style={{ fontSize: "0.85rem" }} />
                </div>
                <div className="timeline-content bg-light p-3 rounded-4 flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "0.9rem" }}>{evt.title}</h6>
                    <span className="text-muted small flex-shrink-0 ms-3">{evt.date}</span>
                  </div>
                  <p className="text-muted small mb-0">{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
