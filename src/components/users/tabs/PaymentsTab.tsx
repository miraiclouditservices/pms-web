"use client";
import React from "react";

interface PaymentsTabProps {
  viewUser: any;
  agreementData: any;
  loadingAgreement: boolean;
  generateInstallments: (user: any, agr: any, payments: any[]) => any[];
  onRecordPayment: (agr: any, amount: string) => void;
}

export default function PaymentsTab({
  viewUser,
  agreementData,
  loadingAgreement,
  generateInstallments,
  onRecordPayment,
}: PaymentsTabProps) {
  const activeAgr = agreementData?.agreements?.[0] || null;
  const paymentsList = activeAgr?.payments || [];
  const installments = generateInstallments(viewUser, activeAgr, paymentsList);

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
  const totalPaid = activeAgr?.totalPaid || 0;
  const pendingAmount = activeAgr?.pendingAmount || Math.max(0, totalAmount - totalPaid);
  const intervalMonths = paymentType.includes("Quarterly") ? 3 : paymentType.includes("Half-Yearly") ? 6 : paymentType.includes("Yearly") ? 12 : 1;
  const numInst = Math.max(1, Math.ceil(term / intervalMonths));
  const instAmount = Math.ceil(totalAmount / numInst);

  const displayAgr = activeAgr || {
    _id: "virtual-agreement",
    agreementNumber: `AGR-VRT-${viewUser._id?.slice(-6).toUpperCase() || "NEW"}`,
    paymentType,
    totalAmount,
    pendingAmount,
    installmentAmount: instAmount,
    payments: [],
  };

  const statusColors: Record<string, string> = {
    Paid: "bg-success bg-opacity-10 text-success",
    Partial: "bg-warning bg-opacity-10 text-warning",
    Pending: "bg-danger bg-opacity-10 text-danger",
  };

  return (
    <div className="text-start d-flex flex-column gap-4">
      {/* Summary Bento Cards */}
      {agreementData?.summary && (
        <div className="row g-3">
          {[
            { label: "Total Agreement", value: agreementData.summary.totalAmount || totalAmount, color: "text-dark", icon: "hgi-invoice" },
            { label: "Total Paid", value: agreementData.summary.totalPaid || totalPaid, color: "text-success", icon: "hgi-checkmark-circle-02" },
            { label: "Pending Balance", value: agreementData.summary.totalPending || pendingAmount, color: "text-danger", icon: "hgi-alert-02" },
            { label: "Active Agreements", value: agreementData.summary.activeCount || 1, color: "text-primary", icon: "hgi-agreement", isCount: true },
          ].map((s, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="detail-card py-3 px-3">
                <i className={`hgi-stroke ${s.icon} ${s.color} fs-4 mb-2 d-block`} />
                <div className={`fw-bold ${s.color}`} style={{ fontSize: "1.2rem" }}>
                  {s.isCount ? s.value : `₹ ${(s.value || 0).toLocaleString()}`}
                </div>
                <div className="text-muted small">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Installment Schedule */}
      <div className="detail-card">
        <div className="detail-card-header">
          <div className="d-flex align-items-center gap-2">
            <i className="hgi-stroke hgi-invoice text-primary fs-5" />
            <h5 className="fw-bold mb-0 text-dark">Installment Schedule</h5>
          </div>
        </div>
        {installments.length > 0 ? (
          <div className="table-responsive">
            <table className="table mb-0 border-0 align-middle">
              <thead>
                <tr>
                  {["Invoice No", "Due Date", "Amount", "Paid", "Balance", "Status"].map(h => (
                    <th key={h} className="bg-light border-0 py-3 text-muted fw-bold" style={{ fontSize: "0.75rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {installments.map((inst) => (
                  <tr key={inst.invoiceNo}>
                    <td className="py-3 fw-bold text-dark" style={{ fontSize: "0.82rem" }}>{inst.invoiceNo}</td>
                    <td className="py-3 text-muted" style={{ fontSize: "0.82rem" }}>{inst.dueDate}</td>
                    <td className="py-3 fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>₹ {inst.amount.toLocaleString()}</td>
                    <td className="py-3 fw-semibold text-success" style={{ fontSize: "0.85rem" }}>₹ {inst.paid.toLocaleString()}</td>
                    <td className="py-3 fw-semibold text-danger" style={{ fontSize: "0.85rem" }}>₹ {inst.balance.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`badge rounded-pill px-3 py-1 ${statusColors[inst.status] || statusColors.Pending}`} style={{ fontSize: "0.72rem", fontWeight: 700 }}>
                        {inst.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-muted">
            <i className="hgi-stroke hgi-folder-open d-block fs-2 mb-2 opacity-40" />
            <span className="small">No installment details available. Configure assignment dates first.</span>
          </div>
        )}
      </div>

      {/* Payment History */}
      {loadingAgreement ? (
        <div className="text-center py-5 text-muted">
          <span className="spinner-border spinner-border-sm me-2" />Loading payment history...
        </div>
      ) : (
        <div className="detail-card mb-0">
          <div className="detail-card-header">
            <div>
              <div className="d-flex align-items-center gap-2">
                <i className="hgi-stroke hgi-invoice text-primary fs-5" />
                <h5 className="fw-bold mb-0 text-dark">Payment History — {displayAgr.agreementNumber}</h5>
              </div>
              <div className="text-muted small mt-1">
                {displayAgr.paymentType} · Total: ₹{displayAgr.totalAmount?.toLocaleString()} · Pending:{" "}
                <span className="text-danger fw-bold">₹{displayAgr.pendingAmount?.toLocaleString()}</span>
              </div>
            </div>
            {displayAgr.pendingAmount > 0 && (
              <button
                className="btn btn-primary btn-sm px-4 fw-bold rounded-pill"
                onClick={() => onRecordPayment(displayAgr, String(displayAgr.installmentAmount || displayAgr.pendingAmount))}
              >
                + Record Payment
              </button>
            )}
          </div>
          {displayAgr.payments?.length > 0 ? (
            <div className="table-responsive">
              <table className="table mb-0 border-0">
                <thead>
                  <tr>
                    {["Receipt No.", "Payment Date", "Amount Paid", "Mode", "Reference", "Notes", "Status"].map(h => (
                      <th key={h} className="bg-light border-0 py-3 text-muted fw-bold" style={{ fontSize: "0.75rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayAgr.payments.map((p: any) => (
                    <tr key={p._id}>
                      <td className="py-3 fw-bold text-dark" style={{ fontSize: "0.82rem" }}>{p.receiptNumber || "—"}</td>
                      <td className="py-3 text-muted" style={{ fontSize: "0.82rem" }}>
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-3 fw-bold text-success" style={{ fontSize: "0.9rem" }}>₹ {(p.amountPaid || p.amount || 0).toLocaleString()}</td>
                      <td className="py-3 text-muted" style={{ fontSize: "0.82rem" }}>{p.paymentMode || "—"}</td>
                      <td className="py-3 text-muted text-truncate" style={{ fontSize: "0.8rem", maxWidth: "130px" }} title={p.transactionRef}>{p.transactionRef || "—"}</td>
                      <td className="py-3 text-muted" style={{ fontSize: "0.8rem", maxWidth: "160px" }}>{p.notes || "—"}</td>
                      <td className="py-3">
                        <span className={`badge rounded-pill px-3 py-1 ${p.status === "Confirmed" ? "bg-success bg-opacity-10 text-success" : "bg-warning bg-opacity-10 text-warning"}`} style={{ fontSize: "0.72rem", fontWeight: 700 }}>
                          {p.status || "Confirmed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <i className="hgi-stroke hgi-folder-open d-block fs-2 mb-2 opacity-40" />
              <span className="small">No payments recorded yet for this agreement.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
