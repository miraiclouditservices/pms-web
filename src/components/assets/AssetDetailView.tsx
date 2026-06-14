"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface AssetDetailViewProps {
  assetId: string;
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

const fmtDateOnly = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const ROW = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "170px 16px 1fr",
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

export default function AssetDetailView({ assetId, onClose, onEdit }: AssetDetailViewProps) {
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [floors, setFloors] = useState<any[]>([]);
  const [propertyDetails, setPropertyDetails] = useState<any>(null);
  const [unitDetails, setUnitDetails] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assets/${assetId}`);
        if (res.success) {
          setAsset(res.data);
          const propertyId = typeof res.data.property === "object" ? res.data.property?._id : res.data.property;
          if (propertyId) {
            // Fetch property details
            api.get(`/properties/${propertyId}`)
              .then(pRes => {
                if (pRes.success) setPropertyDetails(pRes.data);
              })
              .catch(err => console.error("Error fetching property:", err));

            // Fetch floors
            const floorRes = await api.get(`/floors?property=${propertyId}&limit=1000`);
            if (floorRes.success) {
              setFloors(floorRes.data);
            }
          }

          const unitId = typeof res.data.unit === "object" ? res.data.unit?._id : res.data.unit;
          if (unitId) {
            // Fetch unit details
            api.get(`/units/${unitId}`)
              .then(uRes => {
                if (uRes.success) setUnitDetails(uRes.data);
              })
              .catch(err => console.error("Error fetching unit:", err));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [assetId]);

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1100, backdropFilter: "blur(6px)" }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 580 }}>
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
              View Asset
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
                Loading asset details...
              </div>
            ) : !asset ? (
              <div className="text-center py-5 text-muted">Asset not found.</div>
            ) : (
              <>
                {/* Header Code Badge */}
                <div className="text-center mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center mb-2 rounded-circle text-white fw-bold"
                    style={{ width: 56, height: 56, backgroundColor: "#014aad", fontSize: "1.3rem" }}
                  >
                    <i className="bi bi-box-seam"></i>
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
                      {asset.assetCode}
                    </span>
                    <p
                      className="text-muted mt-1 mb-0"
                      style={{ fontSize: "0.72rem" }}
                    >
                      Auto-generated · cannot be changed
                    </p>
                  </div>
                </div>

                {/* Detail Sections */}
                
                {/* General Info */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                    <i className="bi bi-info-circle-fill text-primary me-2"></i>
                    General Information
                  </h6>
                  <ROW label="Asset Description" value={asset.assetDescription} />
                  <ROW label="Category"          value={asset.category} />
                  <ROW label="Make / Brand"      value={asset.makeBrand || asset.make || "—"} />
                  <ROW label="Serial Number"     value={asset.serialNumber} />
                  <ROW
                    label="Status"
                    value={
                      <span
                        className={`badge rounded-pill px-3 py-1 ${
                          asset.assetStatus === "Active"
                            ? "bg-success bg-opacity-10 text-success"
                            : asset.assetStatus === "Under Repair"
                            ? "bg-warning bg-opacity-10 text-warning"
                            : "bg-danger bg-opacity-10 text-danger"
                        }`}
                        style={{ fontSize: "0.75rem", fontWeight: 700 }}
                      >
                        {asset.assetStatus || "Active"}
                      </span>
                    }
                  />
                </div>

                {/* Location Info */}
                <div className="mb-4 pt-2">
                  <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                    <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                    Location Details
                  </h6>
                  <ROW 
                    label="Building / Property" 
                    value={
                      <div>
                        <div className="fw-bold text-dark">{propertyDetails?.propertyName || asset.property?.propertyName || "—"}</div>
                        {propertyDetails && (
                          <div className="text-muted small mt-1" style={{ fontSize: "0.78rem", lineHeight: "1.4" }}>
                            <div><strong>Type:</strong> {propertyDetails.propertyType || "—"}</div>
                            <div><strong>Address:</strong> {propertyDetails.propertyAddress || "—"}</div>
                          </div>
                        )}
                      </div>
                    } 
                  />
                  <ROW 
                    label="Floor Level" 
                    value={
                      (() => {
                        const found = floors.find(f => String(f.floorNumber) === String(asset.floorNumber));
                        const name = found ? found.floorName : (asset.floorNumber !== undefined && asset.floorNumber !== null ? `Floor ${asset.floorNumber}` : "—");
                        return (
                          <div>
                            <div className="fw-bold text-dark">{name}</div>
                            {found && (found.assignedOwner || found.assignedAdmin) && (
                              <div className="text-muted small mt-1" style={{ fontSize: "0.78rem", lineHeight: "1.4" }}>
                                {found.assignedOwner && (
                                  <div className="mb-1">
                                    <strong>Floor Owner:</strong> {found.assignedOwner.ownerName || "—"} ({found.assignedOwner.contactNumber || "—"})
                                  </div>
                                )}
                                {found.assignedAdmin && (
                                  <div>
                                    <strong>Admin:</strong> {found.assignedAdmin.name || "—"} ({found.assignedAdmin.phoneNumber || "—"})
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    } 
                  />
                  <ROW 
                    label="Linked Flat / Unit" 
                    value={
                      (() => {
                        const unitNum = asset.unit?.unitNumber;
                        if (!unitNum) return "—";
                        const ownerName = unitDetails?.owner?.ownerName || unitDetails?.ownerName;
                        const ownerPhone = unitDetails?.owner?.contactNumber;
                        return (
                          <div>
                            <div className="fw-bold text-dark">{unitNum} ({asset.unit?.unitType || "—"})</div>
                            {ownerName && (
                              <div className="text-muted small mt-1" style={{ fontSize: "0.78rem", lineHeight: "1.4" }}>
                                <div><strong>Unit Owner:</strong> {ownerName} {ownerPhone ? `(${ownerPhone})` : ""}</div>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    } 
                  />
                  <ROW label="Internal Spot"      value={asset.assetLocation} />
                </div>

                {/* Financial & Warranty Info */}
                <div className="mb-4 pt-2">
                  <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                    <i className="bi bi-credit-card-2-back-fill text-primary me-2"></i>
                    Financial & Warranty
                  </h6>
                  <ROW 
                    label="Purchase Value" 
                    value={asset.purchaseValue !== undefined ? `₹ ${asset.purchaseValue.toLocaleString()}` : "—"} 
                  />
                  <ROW label="Purchase Date"     value={fmtDateOnly(asset.purchaseDate)} />
                  <ROW label="Warranty Start"    value={fmtDateOnly(asset.warrantyStartDate)} />
                  <ROW label="Warranty Expiry"   value={fmtDateOnly(asset.warrantyEndDate)} />
                  <ROW label="AMC Start"         value={fmtDateOnly(asset.amcStartDate)} />
                  <ROW label="AMC Expiry"        value={fmtDateOnly(asset.amcEndDate)} />
                </div>

                {/* Vendor Info */}
                <div className="mb-4 pt-2">
                  <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                    <i className="bi bi-person-badge-fill text-primary me-2"></i>
                    Vendor & Support Information
                  </h6>
                  <ROW label="Vendor Company"    value={asset.vendorName || "—"} />
                  <ROW label="Contact Person"    value={asset.contactName || "—"} />
                  <ROW label="Contact Number"    value={asset.contactNumber || "—"} />
                </div>

                {/* System Audit */}
                <div className="mb-2 pt-2">
                  <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                    <i className="bi bi-shield-fill-check text-primary me-2"></i>
                    System Information
                  </h6>
                  <ROW label="Created At"     value={fmt(asset.createdAt)} />
                  <ROW label="Last Updated"   value={fmt(asset.updatedAt)} />
                </div>
              </>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          {!loading && asset && (
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
                Edit Asset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
