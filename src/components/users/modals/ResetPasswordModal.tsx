"use client";
import React, { useState } from "react";

interface ResetPasswordModalProps {
  onSubmit: (e: React.FormEvent, password: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export default function ResetPasswordModal({
  onSubmit,
  onClose,
  isSubmitting,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(15,23,42,0.65)", zIndex: 1100, backdropFilter: "blur(8px)" }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
        <div className="modal-content border-0 rounded-4 overflow-hidden bg-white">

          {/* Header */}
          <div className="modal-header border-0 px-4 py-3 bg-light d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, backgroundColor: "rgba(239,68,68,0.1)" }}
              >
                <i className="hgi-stroke hgi-key-01 text-danger" />
              </div>
              <div>
                <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: "1rem" }}>
                  Reset Password
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: "0.72rem" }}>
                  Set a new system password for this account
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

          <form onSubmit={e => onSubmit(e, password)}>
            <div className="modal-body px-4 py-4">
              <label className="form-label fw-semibold small text-muted">New Password</label>
              <div className="input-group">
                <input
                  type={show ? "text" : "password"}
                  className="form-control border-end-0"
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="input-group-text bg-white border-start-0"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShow(!show)}
                >
                  <i className={`hgi-stroke ${show ? "hgi-view-off-slash" : "hgi-view"} text-muted`} />
                </button>
              </div>
              <p className="text-muted small mt-2 mb-0" style={{ fontSize: "0.75rem" }}>
                This will immediately encrypt and update the user&apos;s password in the database.
              </p>
            </div>

            <div className="modal-footer border-0 px-4 py-3 bg-light d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-danger rounded-pill px-4 fw-bold"
                disabled={isSubmitting || password.length < 6}
              >
                {isSubmitting ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Resetting...</>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
