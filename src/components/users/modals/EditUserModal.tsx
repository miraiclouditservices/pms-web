"use client";
import React from "react";

interface EditUserModalProps {
  editForm: any;
  setEditForm: (val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

const FIELD = (label: string, children: React.ReactNode, col = "col-md-6") => (
  <div className={col}>
    <label className="form-label fw-semibold small text-muted">{label}</label>
    {children}
  </div>
);

export default function EditUserModal({
  editForm,
  setEditForm,
  onSubmit,
  onClose,
  isSubmitting,
}: EditUserModalProps) {
  const set = (key: string, val: any) => setEditForm({ ...editForm, [key]: val });
  const isOwner = editForm.role === "OFFICE_OWNER" || editForm.role === "Owner";

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(15,23,42,0.65)", zIndex: 1100, backdropFilter: "blur(8px)" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 rounded-4 overflow-hidden bg-white">

          {/* Header */}
          <div className="modal-header border-0 px-4 py-3 bg-light d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, backgroundColor: "rgba(1,74,173,0.1)" }}
              >
                <i className="hgi-stroke hgi-pencil-line-01 text-primary" />
              </div>
              <div>
                <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: "1rem" }}>
                  Edit User Profile
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: "0.72rem" }}>
                  Update user details and agreement settings
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%", border: "none",
                background: "transparent", cursor: "pointer", fontSize: "1.1rem",
                color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>

              {/* Section: Personal Info */}
              <p className="text-muted text-uppercase fw-bold mb-3" style={{ fontSize: "0.7rem", letterSpacing: "0.06em" }}>
                Personal Information
              </p>
              <div className="row g-3 mb-4">
                {FIELD("Full Name", <input type="text" className="form-control" required value={editForm.name} onChange={e => set("name", e.target.value)} />)}
                {FIELD("Official Email", <input type="email" className="form-control" required value={editForm.email} onChange={e => set("email", e.target.value)} />)}
                {FIELD("Mobile Number", <input type="text" className="form-control" value={editForm.phoneNumber} onChange={e => set("phoneNumber", e.target.value)} />)}
                {FIELD("Alternate / Emergency Contact", <input type="text" className="form-control" value={editForm.emergencyNumber} onChange={e => set("emergencyNumber", e.target.value)} />)}
                {FIELD("Residential / Office Address",
                  <input type="text" className="form-control" value={editForm.address} onChange={e => set("address", e.target.value)} />,
                  "col-12"
                )}
              </div>

              {/* Section: Agreement Settings */}
              <p className="text-muted text-uppercase fw-bold mb-3" style={{ fontSize: "0.7rem", letterSpacing: "0.06em" }}>
                Agreement Settings
              </p>
              <div className="row g-3">
                {FIELD("Agreement Status",
                  <select className="form-select" value={editForm.agreementStatus} onChange={e => set("agreementStatus", e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Expired">Expired</option>
                  </select>
                )}

                {isOwner ? (
                  <>
                    {FIELD("Total Agreement Amount",
                      <input type="number" className="form-control" value={editForm.totalAgreementAmount} onChange={e => set("totalAgreementAmount", Number(e.target.value))} />
                    )}
                    {FIELD("Payment Type",
                      <select className="form-select" value={editForm.paymentType} onChange={e => set("paymentType", e.target.value)}>
                        <option value="One Time">One Time</option>
                        <option value="Monthly Installment">Monthly Installment</option>
                        <option value="Quarterly Installment">Quarterly Installment</option>
                        <option value="Half-Yearly Installment">Half-Yearly Installment</option>
                        <option value="Yearly Installment">Yearly Installment</option>
                        <option value="Custom Installment">Custom Installment</option>
                      </select>
                    )}
                  </>
                ) : (
                  <>
                    {FIELD("Monthly Management Amount",
                      <input type="number" className="form-control" value={editForm.monthlyManagementAmount} onChange={e => set("monthlyManagementAmount", Number(e.target.value))} />
                    )}
                    {FIELD("Payment Type",
                      <select className="form-select" value={editForm.paymentType} onChange={e => set("paymentType", e.target.value)}>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    )}
                  </>
                )}

                {FIELD("Payment Due Day",
                  <input type="number" className="form-control" min={1} max={31} value={editForm.paymentDueDay} onChange={e => set("paymentDueDay", Number(e.target.value))} />
                )}
                {FIELD("Assignment Start Date",
                  <input type="date" className="form-control" value={editForm.floorAssignmentStartDate} onChange={e => set("floorAssignmentStartDate", e.target.value)} />
                )}
                {FIELD("Assignment End Date",
                  <input type="date" className="form-control" value={editForm.floorAssignmentEndDate} onChange={e => set("floorAssignmentEndDate", e.target.value)} />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 px-4 py-3 bg-light d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-pill px-4 fw-bold"
                style={{ backgroundColor: "#014aad", borderColor: "#014aad" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
