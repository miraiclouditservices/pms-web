"use client";
import React from "react";

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Other"];

interface RecordPaymentModalProps {
  agreement: any;
  amountInput: string;
  setAmountInput: (v: string) => void;
  dateInput: string;
  setDateInput: (v: string) => void;
  modeInput: string;
  setModeInput: (v: string) => void;
  refInput: string;
  setRefInput: (v: string) => void;
  notesInput: string;
  setNotesInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export default function RecordPaymentModal({
  agreement,
  amountInput,
  setAmountInput,
  dateInput,
  setDateInput,
  modeInput,
  setModeInput,
  refInput,
  setRefInput,
  notesInput,
  setNotesInput,
  onSubmit,
  onClose,
  isSubmitting,
}: RecordPaymentModalProps) {
  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(15,23,42,0.72)", zIndex: 1200, backdropFilter: "blur(10px)" }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 540 }}>
        <div className="modal-content border-0 rounded-4 overflow-hidden bg-white">

          {/* Gradient Header */}
          <div
            className="modal-header border-0 px-4 py-3 d-flex align-items-center justify-content-between"
            style={{ background: "linear-gradient(135deg, #014aad 0%, #0266e8 100%)" }}
          >
            <div className="d-flex align-items-center gap-2 text-white">
              <i className="hgi-stroke hgi-wallet-01 fs-5" />
              <div>
                <h5 className="fw-bold mb-0" style={{ fontSize: "1rem" }}>Record Payment</h5>
                <p className="mb-0 opacity-75" style={{ fontSize: "0.72rem" }}>
                  {agreement.agreementNumber}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%", border: "none",
                background: "rgba(255,255,255,0.15)", cursor: "pointer", fontSize: "1.2rem",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>

          {/* Agreement Summary Banner */}
          <div className="px-4 py-3" style={{ backgroundColor: "#f0f7ff", borderBottom: "1px solid #dbeafe" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                  AGREEMENT
                </div>
                <div className="fw-bold text-dark">{agreement.agreementNumber}</div>
                <div className="text-muted small">
                  {agreement.paymentType} · ₹{agreement.installmentAmount?.toLocaleString()} per installment
                </div>
              </div>
              <div className="text-end">
                <div className="text-muted small fw-semibold" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                  PENDING BALANCE
                </div>
                <div className="fw-bold text-danger" style={{ fontSize: "1.4rem" }}>
                  ₹ {agreement.pendingAmount?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <div className="modal-body p-4">
              <div className="row g-3">

                {/* Amount */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted text-uppercase" style={{ letterSpacing: "0.05em" }}>
                    Amount Paying (₹) *
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 fw-bold text-muted">₹</span>
                    <input
                      type="number"
                      className="form-control border-start-0"
                      placeholder={String(agreement.installmentAmount || agreement.pendingAmount)}
                      value={amountInput}
                      onChange={e => setAmountInput(e.target.value)}
                      required
                      min={1}
                      max={agreement.pendingAmount}
                    />
                  </div>
                  <div className="form-text text-muted" style={{ fontSize: "0.73rem" }}>
                    Max: ₹{agreement.pendingAmount?.toLocaleString()}
                  </div>
                </div>

                {/* Date */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted text-uppercase" style={{ letterSpacing: "0.05em" }}>
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateInput}
                    onChange={e => setDateInput(e.target.value)}
                    required
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {/* Payment Mode */}
                <div className="col-12">
                  <label className="form-label fw-semibold small text-muted text-uppercase" style={{ letterSpacing: "0.05em" }}>
                    Payment Mode *
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {PAYMENT_MODES.map(mode => (
                      <button
                        key={mode}
                        type="button"
                        className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold ${modeInput === mode ? "btn-primary" : "btn-outline-secondary"}`}
                        style={{ fontSize: "0.8rem" }}
                        onClick={() => setModeInput(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reference */}
                <div className="col-12">
                  <label className="form-label fw-semibold small text-muted text-uppercase" style={{ letterSpacing: "0.05em" }}>
                    Transaction / Reference No.
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. UTR123456789, CHQ-00421"
                    value={refInput}
                    onChange={e => setRefInput(e.target.value)}
                  />
                  <div className="form-text text-muted" style={{ fontSize: "0.73rem" }}>
                    Auto-generated receipt if left blank.
                  </div>
                </div>

                {/* Notes */}
                <div className="col-12">
                  <label className="form-label fw-semibold small text-muted text-uppercase" style={{ letterSpacing: "0.05em" }}>
                    Notes / Remarks
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="e.g. Paid via NEFT, partial payment for June"
                    value={notesInput}
                    onChange={e => setNotesInput(e.target.value)}
                  />
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 px-4 py-3 bg-light d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-pill px-4 fw-bold d-flex align-items-center gap-2"
                style={{ backgroundColor: "#014aad", borderColor: "#014aad" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><span className="spinner-border spinner-border-sm" /> Recording...</>
                ) : (
                  <><i className="hgi-stroke hgi-checkmark-circle-02" /> Confirm Payment</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
