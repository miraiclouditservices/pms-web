"use client";
import React, { useState, useEffect } from "react";

interface VendorFormModalProps {
  mode: "create" | "edit" | "view";
  editData?: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

interface VendorForm {
  vendorName: string;
  address: string;
  scopeOfWork: string;
  contactName: string;
  contactNumber: string;
  emergencyNumber: string;
  emailId: string;
  gstNumber: string;
  status: string;
}

const EMPTY_FORM: VendorForm = {
  vendorName: "",
  address: "",
  scopeOfWork: "",
  contactName: "",
  contactNumber: "",
  emergencyNumber: "",
  emailId: "",
  gstNumber: "",
  status: "Active",
};

const buildForm = (mode: string, editData?: any): VendorForm => {
  if (mode !== "create" && editData) {
    return {
      vendorName:      editData.vendorName      || "",
      address:         editData.address         || "",
      scopeOfWork:     editData.scopeOfWork     || "",
      contactName:     editData.contactName     || "",
      contactNumber:   editData.contactNumber   || editData.mobileNumber || "",
      emergencyNumber: editData.emergencyNumber || "",
      emailId:         editData.emailId         || "",
      gstNumber:       editData.gstNumber       || "",
      status:          editData.status          || "Active",
    };
  }
  return { ...EMPTY_FORM };
};

export default function VendorFormModal({
  mode,
  editData,
  onSubmit,
  onClose,
  isSubmitting = false,
}: VendorFormModalProps) {
  // Lazy initializer — form is always fully defined on first render
  const [form, setForm] = useState<VendorForm>(() => buildForm(mode, editData));
  const isView = mode === "view";
  const set = (key: keyof VendorForm, val: string) =>
    setForm(p => ({ ...p, [key]: val }));

  // Reset form when modal is re-opened with different data
  useEffect(() => {
    setForm(buildForm(mode, editData));
  }, [mode, editData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isView) { onClose(); return; }
    onSubmit({ ...form, _id: editData?._id });
  };

  const title =
    mode === "create" ? "Add New Vendor" :
    mode === "edit"   ? "Edit Vendor" :
                        "Vendor Details";

  // ── Shared input style ──────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    backgroundColor: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "0.88rem",
    color: "#374151",
    padding: "10px 14px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "6px",
    display: "block",
  };

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        zIndex: 1100,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 620 }}
      >
        <div
          className="modal-content border-0 overflow-hidden"
          style={{ borderRadius: "10px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        >
          {/* ── Dark Header ─────────────────────────────────────────────── */}
          <div
            className="d-flex align-items-center justify-content-between px-4 py-3"
            style={{ backgroundColor: "#3a3a3a" }}
          >
            <h5
              className="mb-0 text-white fw-semibold"
              style={{ fontSize: "1rem", letterSpacing: "0.01em" }}
            >
              {title}
            </h5>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#d1d5db",
                fontSize: "1.4rem",
                lineHeight: 1,
                cursor: "pointer",
                padding: "0 2px",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}
              title="Close"
            >
              ×
            </button>
          </div>

          {/* ── Form Body ───────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit}>
            <div
              className="px-4 py-4"
              style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}
            >
              {/* Vendor Code — shown as badge in edit/view, hidden in create */}
              {mode !== "create" && editData?.vendorCode && (
                <div className="mb-3">
                  <label style={labelStyle}>Vendor Code</label>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: "rgba(1,74,173,0.08)",
                      border: "1px solid rgba(1,74,173,0.2)",
                      borderRadius: 6,
                      padding: "8px 16px",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#014aad",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <i className="hgi-stroke hgi-tag me-1" style={{ fontSize: "0.85rem" }} />
                    {editData.vendorCode}
                  </div>
                  <p className="text-muted mb-0 mt-1" style={{ fontSize: "0.72rem" }}>
                    Auto-generated by system — cannot be changed
                  </p>
                </div>
              )}

              {/* Row 1 — Vendor Name (full width) */}
              <div className="row g-4 mb-3">
                <div className="col-12">
                  <label style={labelStyle}>
                    Vendor Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={inputStyle}
                    placeholder="Enter vendor company name"
                    required
                    readOnly={isView}
                    value={form.vendorName}
                    onChange={e => set("vendorName", e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2 — Contact Name + Contact Number */}
              <div className="row g-4 mb-3">
                <div className="col-6">
                  <label style={labelStyle}>
                    Contact Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={inputStyle}
                    placeholder="Enter contact person name"
                    required
                    readOnly={isView}
                    value={form.contactName}
                    onChange={e => set("contactName", e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label style={labelStyle}>
                    Contact Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={inputStyle}
                    placeholder="Primary contact number"
                    required
                    readOnly={isView}
                    value={form.contactNumber}
                    onChange={e => set("contactNumber", e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2b — Emergency Number */}
              <div className="row g-4 mb-3">
                <div className="col-6">
                  <label style={labelStyle}>Emergency Number</label>
                  <input
                    type="text"
                    className="form-control"
                    style={inputStyle}
                    placeholder="Alternate / emergency contact"
                    readOnly={isView}
                    value={form.emergencyNumber}
                    onChange={e => set("emergencyNumber", e.target.value)}
                  />
                </div>
                <div className="col-6" />
              </div>

              {/* Row 3 — Email + GST */}
              <div className="row g-4 mb-3">
                <div className="col-6">
                  <label style={labelStyle}>
                    Email ID <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    style={inputStyle}
                    placeholder="vendor@email.com"
                    required
                    readOnly={isView}
                    value={form.emailId}
                    onChange={e => set("emailId", e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label style={labelStyle}>GST Number</label>
                  <input
                    type="text"
                    className="form-control"
                    style={inputStyle}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    readOnly={isView}
                    value={form.gstNumber}
                    onChange={e => set("gstNumber", e.target.value)}
                  />
                </div>
              </div>

              {/* Row 4 — Scope + Status */}
              <div className="row g-4 mb-3">
                <div className="col-6">
                  <label style={labelStyle}>
                    Scope of Work <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={inputStyle}
                    placeholder="e.g. Electrical, Plumbing"
                    required
                    readOnly={isView}
                    value={form.scopeOfWork}
                    onChange={e => set("scopeOfWork", e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label style={labelStyle}>
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    style={inputStyle}
                    disabled={isView}
                    value={form.status}
                    onChange={e => set("status", e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Row 5 — Address (full width) */}
              <div className="row g-4 mb-1">
                <div className="col-12">
                  <label style={labelStyle}>
                    Address <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    style={{ ...inputStyle, resize: "none" }}
                    rows={3}
                    placeholder="Enter full vendor address"
                    required
                    readOnly={isView}
                    value={form.address}
                    onChange={e => set("address", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── Footer — centered submit ───────────────────────────────── */}
            <div className="d-flex justify-content-end gap-3 px-4 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
              {!isView ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn px-5 py-2 fw-semibold"
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.88rem",
                      color: "#374151",
                      backgroundColor: "#fff",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn px-5 py-2 fw-bold text-white"
                    style={{
                      backgroundColor: "#014aad",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.88rem",
                      letterSpacing: "0.04em",
                      minWidth: 140,
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><span className="spinner-border spinner-border-sm me-2" />
                        {mode === "create" ? "Saving..." : "Updating..."}
                      </>
                    ) : (
                      mode === "create" ? "SUBMIT" : "UPDATE"
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="btn px-5 py-2 fw-bold text-white"
                  style={{ backgroundColor: "#014aad", border: "none", borderRadius: "6px", fontSize: "0.88rem" }}
                >
                  Close
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
