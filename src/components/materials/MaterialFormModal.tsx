"use client";

import { useState, useEffect, useRef } from "react";
import { ModalMode } from "@/components/dashboard/AssetModal";
import { api } from "@/utils/api";

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

const APPROVAL_CFG = {
  "Property Level": { icon: "bi-building",      bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", label: "Property Owner Approval" },
  "Floor Level":    { icon: "bi-layers",         bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Floor Owner / Admin Approval" },
  "Office Level":   { icon: "bi-door-open",      bg: "#fdf4ff", border: "#e9d5ff", color: "#7e22ce", label: "Office Owner Approval" },
} as const;

type ApprovalLevel = keyof typeof APPROVAL_CFG;

const STATUS_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  Approved: { bg: "#dcfce7", color: "#166534", icon: "bi-check-circle-fill" },
  Cleared:  { bg: "#dbeafe", color: "#1e40af", icon: "bi-check-all" },
  Rejected: { bg: "#fee2e2", color: "#991b1b", icon: "bi-x-circle-fill" },
  Pending:  { bg: "#fef9c3", color: "#854d0e", icon: "bi-hourglass-split" },
};

const EMPTY_FORM = {
  gatePassType:   "Inward",
  hsnCode:        "",
  materialDetails:"",
  quantity:       1,
  rate:           "",
  totalCost:      "",
  placeOfVisit:   "",
  purposeOfVisit: "",
  vehicleNumber:  "",
  inTime:         "",
  status:         "Pending",
  rejectionReason:"",
};

export default function MaterialFormModal({ isOpen, onClose, onSave, editData, mode }: MaterialFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const propertyContainerRef = useRef<HTMLDivElement>(null);
  const floorContainerRef = useRef<HTMLDivElement>(null);
  const unitContainerRef = useRef<HTMLDivElement>(null);

  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const [propertySearch, setPropertySearch] = useState("");
  const [floorSearch, setFloorSearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");

  const [properties,      setProperties]      = useState<any[]>([]);
  const [floors,          setFloors]           = useState<any[]>([]);
  const [units,           setUnits]            = useState<any[]>([]);

  const [selProperty, setSelProperty] = useState("");
  const [selFloor,    setSelFloor]    = useState("");
  const [selUnit,     setSelUnit]     = useState("");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (propertyContainerRef.current && !propertyContainerRef.current.contains(event.target as Node)) {
        setShowPropertyDropdown(false);
      }
      if (floorContainerRef.current && !floorContainerRef.current.contains(event.target as Node)) {
        setShowFloorDropdown(false);
      }
      if (unitContainerRef.current && !unitContainerRef.current.contains(event.target as Node)) {
        setShowUnitDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const approvalLevel: ApprovalLevel =
    selUnit     ? "Office Level"   :
    selFloor    ? "Floor Level"    :
    selProperty ? "Property Level" : "Property Level";

  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    if (!isOpen) return;
    api.get("/properties").then(r => { if (r.success) setProperties(r.data); });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (editData && (mode === "edit" || mode === "view")) {
      setFormData({
        gatePassType:    editData.gatePassType    || "Inward",
        materialDetails: editData.materialDetails || "",
        hsnCode:         editData.hsnCode         || "",
        quantity:        editData.quantity        || 1,
        rate:            editData.rate            || "",
        totalCost:       editData.totalCost       || "",
        placeOfVisit:    editData.placeOfVisit    || "",
        purposeOfVisit:  editData.purposeOfVisit  || "",
        vehicleNumber:   editData.vehicleNumber   || "",
        inTime:          editData.inTime          || "",
        status:          editData.status          || "Pending",
        rejectionReason: editData.rejectionReason || "",
      });
      setSelProperty(editData.property?._id || editData.property || "");
      setSelFloor(editData.floor?._id       || editData.floor    || "");
      setSelUnit(editData.unit?._id         || editData.unit     || "");
    } else {
      const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      setFormData({ ...EMPTY_FORM, inTime: t });
      setSelProperty(""); setSelFloor(""); setSelUnit("");
      setFloors([]); setUnits([]);
    }
  }, [editData, isOpen, mode]);

  useEffect(() => {
    const r = parseFloat(String(formData.rate));
    const q = parseInt(String(formData.quantity));
    if (!isNaN(r) && !isNaN(q) && mode !== "view") {
      setFormData(p => ({ ...p, totalCost: String(r * q) }));
    }
  }, [formData.rate, formData.quantity, mode]);

  const handlePropertyChange = async (propId: string) => {
    setSelProperty(propId); setSelFloor(""); setSelUnit("");
    setFloors([]); setUnits([]);
    if (!propId) return;
    try {
      const r = await api.get(`/floors?property=${propId}`);
      if (r.success) setFloors(r.data);
    } catch { /* silent */ }
  };

  const handleFloorChange = async (floorId: string) => {
    setSelFloor(floorId); setSelUnit(""); setUnits([]);
    if (!floorId) return;
    try {
      const r = await api.get(`/units?floor=${floorId}`);
      if (r.success) setUnits(r.data);
    } catch { /* silent */ }
  };

  const handleUnitChange = (unitId: string) => setSelUnit(unitId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") { onClose(); return; }
    if (!selProperty) { alert("Property is required."); return; }
    setIsSubmitting(true);
    try {
      onSave({
        ...formData,
        property:      selProperty || undefined,
        floor:         selFloor    || undefined,
        unit:          selUnit     || undefined,
        approvalLevel,
        ...(editData?._id ? { _id: editData._id } : {}),
      });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  if (!isOpen) return null;
  const isRO = mode === "view";
  const apc  = APPROVAL_CFG[approvalLevel];
  const ss   = STATUS_STYLE[formData.status] || STATUS_STYLE["Pending"];

  const selPropertyObj = properties.find(p => p._id === selProperty);
  const selFloorObj    = floors.find(f => f._id === selFloor);
  const selUnitObj     = units.find(u => u._id === selUnit);

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1100, backdropFilter: "blur(6px)" }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 820 }}>
        <div
          className="modal-content border-0 overflow-hidden"
          style={{ borderRadius: "10px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        >
          {/* Header */}
          <div
            className="d-flex align-items-center justify-content-between px-4 py-3"
            style={{ backgroundColor: "#3a3a3a" }}
          >
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0 text-white fw-semibold" style={{ fontSize: "1rem" }}>
                {mode === "create" ? "Create Gate Pass" : mode === "edit" ? "Edit Gate Pass Details" : "Gate Pass Details"}
              </h5>
              {mode !== "create" && (
                <span className="badge rounded-pill px-3 py-1" style={{ fontSize: "0.72rem", background: ss.bg, color: ss.color }}>
                  <i className={`bi ${ss.icon} me-1`} />{formData.status}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "#d1d5db",
                fontSize: "1.4rem", cursor: "pointer", lineHeight: 1,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Body */}
            <div style={{ padding: "24px", maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>

              {/* Approval Level Indicator */}
              {(selProperty || (mode !== "create" && editData?.approvalLevel)) && (
                <div style={{
                  background: apc.bg, border: `1.5px solid ${apc.border}`,
                  borderRadius: "10px", padding: "12px 16px", marginBottom: "20px",
                  display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: apc.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={`bi ${apc.icon}`} style={{ color: apc.color, fontSize: "1.1rem" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: apc.color }}>Approval Routing</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: apc.color, marginTop: "1px" }}>{apc.label}</div>
                    <div style={{ fontSize: "0.7rem", color: apc.color + "bb", marginTop: "1px" }}>
                      {approvalLevel === "Property Level" && "Gate Pass request notification → Property Owner"}
                      {approvalLevel === "Floor Level"    && "Gate Pass request notification → Floor Owner / Admin"}
                      {approvalLevel === "Office Level"   && "Gate Pass request notification → Office Owner"}
                    </div>
                  </div>
                  <span style={{ background: apc.color, color: "#fff", borderRadius: "20px", padding: "3px 12px", fontSize: "0.68rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {approvalLevel}
                  </span>
                </div>
              )}

              <div className="row g-3">
                {/* Section 1: Material Details */}
                <div className="col-12">
                  <h6 className="fw-bold mb-1 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                    <i className="bi bi-box-seam text-primary me-2"></i>
                    Material Details
                  </h6>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-dark">Gate Pass Type *</label>
                  <select
                    className="form-select bg-white"
                    disabled={isRO}
                    value={formData.gatePassType}
                    onChange={e => setFormData(p => ({ ...p, gatePassType: e.target.value }))}
                    style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                  >
                    <option value="Inward">⬇ Inward</option>
                    <option value="Outward">⬆ Outward</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-dark">HSN Code</label>
                  <input
                    type="text"
                    className="form-control bg-white"
                    disabled={isRO}
                    placeholder="HSN code..."
                    value={formData.hsnCode}
                    onChange={e => setFormData(p => ({ ...p, hsnCode: e.target.value }))}
                    style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-dark">Quantity *</label>
                  <input
                    type="number"
                    className="form-control bg-white"
                    required
                    disabled={isRO}
                    min="1"
                    placeholder="1"
                    value={formData.quantity}
                    onChange={e => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                    style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-dark">Rate (₹)</label>
                  <input
                    type="number"
                    className="form-control bg-white"
                    disabled={isRO}
                    placeholder="0"
                    value={formData.rate}
                    onChange={e => setFormData(p => ({ ...p, rate: e.target.value }))}
                    style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-dark">Total Cost (₹)</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    disabled
                    readOnly
                    style={{ fontSize: "0.85rem", padding: "8px 12px", fontWeight: 700, color: "#1e293b" }}
                    value={formData.totalCost ? `₹ ${Number(formData.totalCost).toLocaleString()}` : ""}
                  />
                </div>

                <div className="col-md-8">
                  <label className="form-label small fw-semibold text-dark">Material details *</label>
                  <input
                    type="text"
                    className="form-control bg-white"
                    required
                    disabled={isRO}
                    placeholder="Describe the materials..."
                    value={formData.materialDetails}
                    onChange={e => setFormData(p => ({ ...p, materialDetails: e.target.value }))}
                    style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                  />
                </div>

                {/* Section 2: Visiting Location */}
                <div className="col-12 mt-4">
                  <h6 className="fw-bold mb-1 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                    <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                    Visiting Location
                  </h6>
                </div>

                {/* Property Dropdown */}
                <div className="col-md-4 position-relative" ref={propertyContainerRef}>
                  <label className="form-label small fw-semibold text-dark">Property / Building *</label>
                  <div
                    className="form-control d-flex justify-content-between align-items-center bg-white"
                    onClick={() => !isRO && setShowPropertyDropdown(prev => !prev)}
                    style={{
                      fontSize: "0.85rem", padding: "8px 12px",
                      cursor: isRO ? "not-allowed" : "pointer",
                      border: "1px solid #ced4da", borderRadius: "0.375rem", userSelect: "none"
                    }}
                  >
                    <span>
                      {properties.find(p => p._id === selProperty)?.propertyName || "Select Property..."}
                    </span>
                    {!isRO && (
                      <i className={`bi bi-chevron-${showPropertyDropdown ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }} />
                    )}
                  </div>

                  {showPropertyDropdown && !isRO && (
                    <div
                      className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                      style={{
                        top: "100%", left: 12, right: 12, zIndex: 1050,
                        marginTop: "4px", maxHeight: "280px", display: "flex", flexDirection: "column"
                      }}
                    >
                      <div className="position-relative mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm ps-3"
                          placeholder="Search property..."
                          value={propertySearch}
                          onChange={e => setPropertySearch(e.target.value)}
                          style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                          autoFocus
                        />
                        {propertySearch && (
                          <button
                            type="button"
                            onClick={() => setPropertySearch("")}
                            className="position-absolute border-0 bg-transparent text-muted"
                            style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="overflow-auto flex-grow-1" style={{ maxHeight: "180px" }}>
                        {(() => {
                          const filtered = properties.filter(p =>
                            p.propertyName?.toLowerCase().includes(propertySearch.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return <div className="text-muted text-center py-2 small">No matches found</div>;
                          }
                          return filtered.map(p => {
                            const isSelected = selProperty === p._id;
                            return (
                              <div
                                key={p._id}
                                onClick={() => {
                                  handlePropertyChange(p._id);
                                  setShowPropertyDropdown(false);
                                  setPropertySearch("");
                                }}
                                className="px-3 py-2 rounded-2 small"
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: isSelected ? "#f1f5f9" : "transparent",
                                  color: isSelected ? "#014aad" : "#334155",
                                  fontWeight: isSelected ? 600 : 400,
                                }}
                                onMouseEnter={e => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = "#f8fafc";
                                    e.currentTarget.style.color = "#000";
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "#334155";
                                  }
                                }}
                              >
                                {p.propertyName}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {selPropertyObj && (
                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                      <i className="bi bi-geo-alt me-1" style={{ color: "#014aad" }} />
                      {selPropertyObj.propertyAddress} · {selPropertyObj.propertyType}
                    </div>
                  )}
                </div>

                {/* Floor Dropdown */}
                {selProperty && (
                  <div className="col-md-4 position-relative" ref={floorContainerRef}>
                    <label className="form-label small fw-semibold text-dark">Floor Level</label>
                    <div
                      className="form-control d-flex justify-content-between align-items-center bg-white"
                      onClick={() => !isRO && setShowFloorDropdown(prev => !prev)}
                      style={{
                        fontSize: "0.85rem", padding: "8px 12px",
                        cursor: isRO ? "not-allowed" : "pointer",
                        border: "1px solid #ced4da", borderRadius: "0.375rem", userSelect: "none"
                      }}
                    >
                      <span>
                        {selFloor ? `Floor ${floors.find(f => f._id === selFloor)?.floorNumber || ""}` : "Select Floor (optional)..."}
                      </span>
                      {!isRO && (
                        <i className={`bi bi-chevron-${showFloorDropdown ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }} />
                      )}
                    </div>

                    {showFloorDropdown && !isRO && (
                      <div
                        className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                        style={{
                          top: "100%", left: 12, right: 12, zIndex: 1050,
                          marginTop: "4px", maxHeight: "280px", display: "flex", flexDirection: "column"
                        }}
                      >
                        <div className="position-relative mb-2">
                          <input
                            type="text"
                            className="form-control form-control-sm ps-3"
                            placeholder="Search floor..."
                            value={floorSearch}
                            onChange={e => setFloorSearch(e.target.value)}
                            style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                            autoFocus
                          />
                          {floorSearch && (
                            <button
                              type="button"
                              onClick={() => setFloorSearch("")}
                              className="position-absolute border-0 bg-transparent text-muted"
                              style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                            >
                              ×
                            </button>
                          )}
                        </div>

                        <div className="overflow-auto flex-grow-1" style={{ maxHeight: "180px" }}>
                          <div
                            onClick={() => {
                              handleFloorChange("");
                              setShowFloorDropdown(false);
                              setFloorSearch("");
                            }}
                            className="px-3 py-2 rounded-2 cursor-pointer text-start text-danger small"
                            style={{ cursor: "pointer" }}
                          >
                            Clear Selection
                          </div>
                          {(() => {
                            const filtered = floors.filter(f =>
                              String(f.floorNumber).toLowerCase().includes(floorSearch.toLowerCase()) ||
                              f.floorName?.toLowerCase().includes(floorSearch.toLowerCase())
                            );
                            if (filtered.length === 0) {
                              return <div className="text-muted text-center py-2 small">No matches found</div>;
                            }
                            return filtered.map(f => {
                              const isSelected = selFloor === f._id;
                              return (
                                <div
                                  key={f._id}
                                  onClick={() => {
                                    handleFloorChange(f._id);
                                    setShowFloorDropdown(false);
                                    setFloorSearch("");
                                  }}
                                  className="px-3 py-2 rounded-2 small"
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: isSelected ? "#f1f5f9" : "transparent",
                                    color: isSelected ? "#014aad" : "#334155",
                                    fontWeight: isSelected ? 600 : 400,
                                  }}
                                  onMouseEnter={e => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = "#f8fafc";
                                      e.currentTarget.style.color = "#000";
                                    }
                                  }}
                                  onMouseLeave={e => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = "transparent";
                                      e.currentTarget.style.color = "#334155";
                                    }
                                  }}
                                >
                                  Floor {f.floorNumber} {f.floorName ? `— ${f.floorName}` : ""}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {selFloorObj && (
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                        <i className="bi bi-info-circle me-1" />
                        {selFloorObj.totalUnits} units · {selFloorObj.totalSft} sqft
                      </div>
                    )}
                  </div>
                )}

                {/* Office / Unit Dropdown */}
                {selFloor && (
                  <div className="col-md-4 position-relative" ref={unitContainerRef}>
                    <label className="form-label small fw-semibold text-dark">Office / Unit</label>
                    <div
                      className="form-control d-flex justify-content-between align-items-center bg-white"
                      onClick={() => !isRO && setShowUnitDropdown(prev => !prev)}
                      style={{
                        fontSize: "0.85rem", padding: "8px 12px",
                        cursor: isRO ? "not-allowed" : "pointer",
                        border: "1px solid #ced4da", borderRadius: "0.375rem", userSelect: "none"
                      }}
                    >
                      <span>
                        {selUnit ? `Unit ${units.find(u => u._id === selUnit)?.unitNumber || ""}` : "Select Office / Unit (optional)..."}
                      </span>
                      {!isRO && (
                        <i className={`bi bi-chevron-${showUnitDropdown ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }} />
                      )}
                    </div>

                    {showUnitDropdown && !isRO && (
                      <div
                        className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                        style={{
                          top: "100%", left: 12, right: 12, zIndex: 1050,
                          marginTop: "4px", maxHeight: "280px", display: "flex", flexDirection: "column"
                        }}
                      >
                        <div className="position-relative mb-2">
                          <input
                            type="text"
                            className="form-control form-control-sm ps-3"
                            placeholder="Search unit/office..."
                            value={unitSearch}
                            onChange={e => setUnitSearch(e.target.value)}
                            style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                            autoFocus
                          />
                          {unitSearch && (
                            <button
                              type="button"
                              onClick={() => setUnitSearch("")}
                              className="position-absolute border-0 bg-transparent text-muted"
                              style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                            >
                              ×
                            </button>
                          )}
                        </div>

                        <div className="overflow-auto flex-grow-1" style={{ maxHeight: "180px" }}>
                          <div
                            onClick={() => {
                              handleUnitChange("");
                              setShowUnitDropdown(false);
                              setUnitSearch("");
                            }}
                            className="px-3 py-2 rounded-2 cursor-pointer text-start text-danger small"
                            style={{ cursor: "pointer" }}
                          >
                            Clear Selection
                          </div>
                          {(() => {
                            const filtered = units.filter(u =>
                              String(u.unitNumber).toLowerCase().includes(unitSearch.toLowerCase()) ||
                              u.ownerName?.toLowerCase().includes(unitSearch.toLowerCase())
                            );
                            if (filtered.length === 0) {
                              return <div className="text-muted text-center py-2 small">No matches found</div>;
                            }
                            return filtered.map(u => {
                              const isSelected = selUnit === u._id;
                              return (
                                <div
                                  key={u._id}
                                  onClick={() => {
                                    handleUnitChange(u._id);
                                    setShowUnitDropdown(false);
                                    setUnitSearch("");
                                  }}
                                  className="px-3 py-2 rounded-2 small"
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: isSelected ? "#f1f5f9" : "transparent",
                                    color: isSelected ? "#014aad" : "#334155",
                                    fontWeight: isSelected ? 600 : 400,
                                  }}
                                  onMouseEnter={e => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = "#f8fafc";
                                      e.currentTarget.style.color = "#000";
                                    }
                                  }}
                                  onMouseLeave={e => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = "transparent";
                                      e.currentTarget.style.color = "#334155";
                                    }
                                  }}
                                >
                                  Unit {u.unitNumber} {u.ownerName ? `· ${u.ownerName}` : ""}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {selUnitObj && (
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                        <i className="bi bi-person me-1" />
                        {selUnitObj.ownerName || "No owner"} · {selUnitObj.unitType} · {selUnitObj.sqft} sqft
                      </div>
                    )}
                  </div>
                )}

                {/* Section 3: Movement Details */}
                <div className="col-12 mt-4">
                  <h6 className="fw-bold mb-1 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                    <i className="bi bi-truck text-primary me-2"></i>
                    Movement Information
                  </h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">Place of Visit</label>
                  <input
                    type="text"
                    className="form-control bg-white"
                    disabled={isRO}
                    placeholder="Destination..."
                    value={formData.placeOfVisit}
                    onChange={e => setFormData(p => ({ ...p, placeOfVisit: e.target.value }))}
                    style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">Purpose</label>
                  <input
                    type="text"
                    className="form-control bg-white"
                    disabled={isRO}
                    placeholder="Reason for movement..."
                    value={formData.purposeOfVisit}
                    onChange={e => setFormData(p => ({ ...p, purposeOfVisit: e.target.value }))}
                    style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">Vehicle No</label>
                  <input
                    type="text"
                    className="form-control bg-white"
                    disabled={isRO}
                    placeholder="Optional..."
                    value={formData.vehicleNumber}
                    onChange={e => setFormData(p => ({ ...p, vehicleNumber: e.target.value }))}
                    style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">In Time</label>
                  <input
                    type="text"
                    className="form-control bg-white"
                    disabled={isRO}
                    value={formData.inTime}
                    onChange={e => setFormData(p => ({ ...p, inTime: e.target.value }))}
                    style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                  />
                </div>

                {/* Section 4: Security Approval Status */}
                {mode !== "create" && (
                  <>
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold mb-1 d-flex align-items-center" style={{ fontSize: "0.9rem", color: "#014aad" }}>
                        <i className="bi bi-shield-lock-fill text-primary me-2"></i>
                        Security Approval Status
                      </h6>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-dark">Status</label>
                      <select
                        className="form-select bg-white"
                        disabled={isRO}
                        value={formData.status}
                        onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                        style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Cleared">Cleared</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {formData.status === "Rejected" && (
                      <div className="col-md-8">
                        <label className="form-label small fw-semibold text-dark">Rejection Reason</label>
                        <input
                          type="text"
                          className="form-control bg-white"
                          disabled={isRO}
                          placeholder="Reason..."
                          value={formData.rejectionReason || ""}
                          onChange={e => setFormData(p => ({ ...p, rejectionReason: e.target.value }))}
                          style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="d-flex justify-content-between align-items-center px-4 py-4" style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
              <div className="d-flex align-items-center gap-2">
                <i className={`bi ${apc.icon}`} style={{ color: apc.color, fontSize: "0.9rem" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: apc.color }}>
                  {selProperty ? apc.label : "Select a property to determine approval routing"}
                </span>
              </div>
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 fw-semibold"
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{ fontSize: "0.85rem", borderRadius: "6px" }}
                >
                  {isRO ? "Close" : "Cancel"}
                </button>
                {!isRO && (
                  <button
                    type="submit"
                    className="btn btn-primary px-5 fw-bold text-white shadow-sm border-0"
                    disabled={isSubmitting}
                    style={{ backgroundColor: "#014aad", fontSize: "0.85rem", borderRadius: "6px" }}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Saving...
                      </>
                    ) : mode === "create" ? (
                      "Submit Gate Pass"
                    ) : (
                      "Update Gate Pass"
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
