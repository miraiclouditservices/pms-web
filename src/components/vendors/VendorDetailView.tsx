"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface VendorDetailViewProps {
  vendorId: string;
  onClose: () => void;
  onEdit: () => void;
}

const fmt = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const ROW = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "160px 16px 1fr",
      alignItems: "flex-start",
      padding: "10px 0",
      borderBottom: "1px solid #f1f5f9",
    }}
  >
    <span style={{ fontSize: "0.83rem", color: "#6b7280", fontWeight: 500 }}>{label}</span>
    <span style={{ color: "#d1d5db" }}>:</span>
    <span style={{ fontSize: "0.85rem", color: "#1f2937", fontWeight: 500 }}>{value || "—"}</span>
  </div>
);

export default function VendorDetailView({ vendorId, onClose, onEdit }: VendorDetailViewProps) {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/vendors/${vendorId}`);
        if (res.success) setVendor(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vendorId]);

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1100, backdropFilter: "blur(6px)" }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 520 }}>
        <div
          className="modal-content border-0 overflow-hidden"
          style={{ borderRadius: "10px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        >
          {/* ── Dark Header ─────────────────────────────────────────────── */}
          <div
            className="d-flex align-items-center justify-content-between px-4 py-3"
            style={{ backgroundColor: "#3a3a3a" }}
          >
            <h5 className="mb-0 text-white fw-semibold" style={{ fontSize: "1rem" }}>
              View Vendor
            </h5>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "#d1d5db",
                fontSize: "1.4rem", lineHeight: 1, cursor: "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}
            >
              ×
            </button>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <div style={{ padding: "24px", maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
            {loading ? (
              <div className="text-center py-5 text-muted">
                <span className="spinner-border spinner-border-sm me-2" />
                Loading vendor details...
              </div>
            ) : !vendor ? (
              <div className="text-center py-5 text-muted">Vendor not found.</div>
            ) : (
              <>
                {/* Vendor Code Badge */}
                <div className="text-center mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center mb-2 rounded-circle text-white fw-bold"
                    style={{ width: 56, height: 56, backgroundColor: "#014aad", fontSize: "1.3rem" }}
                  >
                    {(vendor.vendorName || "V").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span
                      className="badge px-3 py-1 fw-bold"
                      style={{
                        backgroundColor: "rgba(1,74,173,0.1)",
                        color: "#014aad",
                        border: "1px solid rgba(1,74,173,0.25)",
                        borderRadius: 6,
                        fontSize: "0.85rem",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {vendor.vendorCode}
                    </span>
                    <p
                      className="text-muted mt-1 mb-0"
                      style={{ fontSize: "0.72rem" }}
                    >
                      Auto-generated · cannot be changed
                    </p>
                  </div>
                </div>

                {/* Detail Rows */}
                <ROW label="Vendor Name"      value={vendor.vendorName} />
                <ROW label="Contact Name"     value={vendor.contactName} />
                <ROW label="Contact Number"   value={vendor.contactNumber || vendor.mobileNumber} />
                <ROW label="Emergency Number" value={vendor.emergencyNumber} />
                <ROW label="Email ID"         value={vendor.emailId} />
                <ROW label="GST Number"       value={vendor.gstNumber} />
                <ROW label="Scope of Work"    value={vendor.scopeOfWork} />
                <ROW label="Address"          value={vendor.address} />
                <ROW
                  label="Status"
                  value={
                    <span
                      className={`badge rounded-pill px-3 py-1 ${
                        vendor.status === "Active"
                          ? "bg-success bg-opacity-10 text-success"
                          : "bg-danger bg-opacity-10 text-danger"
                      }`}
                      style={{ fontSize: "0.75rem", fontWeight: 700 }}
                    >
                      {vendor.status || "Active"}
                    </span>
                  }
                />
                <ROW label="Created At"     value={fmt(vendor.createdAt)} />
                <ROW label="Last Updated"   value={fmt(vendor.updatedAt)} />
              </>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          {!loading && vendor && (
            <div
              className="d-flex justify-content-end gap-3 px-4 py-3"
              style={{ borderTop: "1px solid #f1f5f9" }}
            >
              <button
                type="button"
                onClick={onClose}
                className="btn px-4 py-2 fw-semibold"
                style={{
                  border: "1px solid #d1d5db", borderRadius: "6px",
                  fontSize: "0.85rem", color: "#374151", backgroundColor: "#fff",
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="btn px-5 py-2 fw-bold text-white"
                style={{ backgroundColor: "#014aad", border: "none", borderRadius: "6px", fontSize: "0.85rem" }}
              >
                Edit Vendor
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
