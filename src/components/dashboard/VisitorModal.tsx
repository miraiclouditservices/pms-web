"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { ModalMode } from "./AssetModal";

interface VisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ID_PROOF_TYPES  = ["Aadhar", "PAN", "Driving License", "Passport", "Other"];
const PURPOSE_OPTIONS = ["Meeting", "Delivery", "Interview", "Maintenance", "Personal", "Other"];
const STATUS_OPTIONS  = ["Pending", "Approved", "Rejected", "Checked-In", "Checked-Out"];

const STATUS_STYLE: Record<string, { bg: string; color: string; icon: string; msg: string }> = {
  Pending:       { bg: "#fef9c3", color: "#854d0e",  icon: "bi-hourglass-split",   msg: "Awaiting approval — entry not yet permitted." },
  Approved:      { bg: "#dcfce7", color: "#166534",  icon: "bi-check-circle-fill", msg: "Access granted — visitor may enter." },
  Rejected:      { bg: "#fee2e2", color: "#991b1b",  icon: "bi-x-circle-fill",     msg: "Entry denied — visitor rejected." },
  "Checked-In":  { bg: "#dbeafe", color: "#1e40af",  icon: "bi-door-open-fill",    msg: "Visitor is currently inside the building." },
  "Checked-Out": { bg: "#f1f5f9", color: "#475569",  icon: "bi-door-closed-fill",  msg: "Visitor has checked out." },
};

// ── Approval level config ─────────────────────────────────────────────────────
const APPROVAL_CFG = {
  "Property Level": { icon: "bi-building",   bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", label: "Property Owner Approval" },
  "Floor Level":    { icon: "bi-layers",     bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Floor Owner / Admin Approval" },
  "Office Level":   { icon: "bi-door-open",  bg: "#fdf4ff", border: "#e9d5ff", color: "#7e22ce", label: "Office Owner Approval" },
} as const;
type ApprovalLevel = keyof typeof APPROVAL_CFG;

const EMPTY = {
  visitorName: "", visitorContactNumber: "", address: "",
  idProofType: "Aadhar", idNumber: "", vehicleNumber: "",
  personToMeet: "", purposeOfVisit: "Meeting",
  visitDate: new Date().toISOString().split("T")[0],
  inTime: "", outTime: "", status: "Pending",
};

export default function VisitorModal({ isOpen, onClose, onSave, editData, mode }: VisitorModalProps) {
  const [formData, setFormData]   = useState<any>({ ...EMPTY });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hierarchy
  const [properties, setProperties] = useState<any[]>([]);
  const [floors,     setFloors]     = useState<any[]>([]);
  const [units,      setUnits]      = useState<any[]>([]);
  const [selProp,    setSelProp]    = useState("");
  const [selFloor,   setSelFloor]   = useState("");
  const [selUnit,    setSelUnit]    = useState("");

  // Derived approval level
  const approvalLevel: ApprovalLevel =
    selUnit ? "Office Level" : selFloor ? "Floor Level" : "Property Level";

  const apc = APPROVAL_CFG[approvalLevel];
  const ss  = STATUS_STYLE[formData.status] || STATUS_STYLE["Pending"];
  const isRO = mode === "view";
  const set = (k: string, v: any) => setFormData((p: any) => ({ ...p, [k]: v }));

  const [currentUser, setCurrentUser] = useState<any>(null);
  const isOwner = currentUser?.role === 'Owner' || currentUser?.role === 'Office Owner';

  // ── Load properties and user info ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      api.get("/properties"),
      api.get("/auth/me")
    ]).then(([propRes, meRes]) => {
      if (propRes.success) setProperties(propRes.data);
      if (meRes.success) setCurrentUser(meRes.data);
    }).catch(() => {});
  }, [isOpen]);

  // ── Pre-fill on edit/view ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (editData && (mode === "edit" || mode === "view")) {
      setFormData({ ...EMPTY, ...editData });
      const pId = editData.property?._id || editData.property || "";
      const fId = editData.floor?._id    || editData.floor    || "";
      const uId = editData.unit?._id     || editData.unit     || "";
      setSelProp(pId); setSelFloor(fId); setSelUnit(uId);
      if (pId) api.get(`/floors?property=${pId}`).then(r => { if (r.success) setFloors(r.data); }).catch(() => {});
      if (fId) api.get(`/units?floor=${fId}`).then(r => { if (r.success) setUnits(r.data); }).catch(() => {});
    } else {
      const now = new Date();
      setFormData({ ...EMPTY, visitDate: now.toISOString().split("T")[0], inTime: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) });
      if (isOwner && currentUser) {
        const assignedUnit = currentUser.assignedUnits?.[0];
        const pId = (currentUser.assignedProperties?.[0]?._id || currentUser.assignedProperties?.[0] || assignedUnit?.property?._id || assignedUnit?.property || "").toString();
        const fId = (currentUser.assignedFloors?.[0]?._id || currentUser.assignedFloors?.[0] || assignedUnit?.floor?._id || assignedUnit?.floor || "").toString();
        const uId = (assignedUnit?._id || "").toString();
        setSelProp(pId);
        setSelFloor(fId);
        setSelUnit(uId);
      } else {
        setSelProp(""); setSelFloor(""); setSelUnit(""); setFloors([]); setUnits([]);
      }
    }
  }, [isOpen, editData, mode, currentUser, isOwner]);

  // ── Property → load floors ───────────────────────────────────────────────────
  const handlePropertyChange = async (id: string) => {
    setSelProp(id); setSelFloor(""); setSelUnit(""); setFloors([]); setUnits([]);
    if (!id) return;
    api.get(`/floors?property=${id}`).then(r => { if (r.success) setFloors(r.data); }).catch(() => {});
  };

  // ── Floor → load units ───────────────────────────────────────────────────────
  const handleFloorChange = async (id: string) => {
    setSelFloor(id); setSelUnit(""); setUnits([]);
    if (!id) return;
    api.get(`/units?floor=${id}`).then(r => { if (r.success) setUnits(r.data); }).catch(() => {});
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRO) { onClose(); return; }

    let finalProp = selProp;
    let finalFloor = selFloor;
    let finalUnit = selUnit;

    if (isOwner && currentUser) {
      const assignedUnit = currentUser.assignedUnits?.[0];
      finalProp = (currentUser.assignedProperties?.[0]?._id || currentUser.assignedProperties?.[0] || assignedUnit?.property?._id || assignedUnit?.property || "").toString();
      finalFloor = (currentUser.assignedFloors?.[0]?._id || currentUser.assignedFloors?.[0] || assignedUnit?.floor?._id || assignedUnit?.floor || "").toString();
      finalUnit = (assignedUnit?._id || "").toString();
    }

    if (!finalProp) { alert("Property is required."); return; }
    setIsSubmitting(true);
    try {
      onSave({
        ...formData,
        property: finalProp  || undefined,
        floor:    finalFloor || undefined,
        unit:     finalUnit  || undefined,
        approvalLevel: isOwner ? "Office Level" : approvalLevel,
        ...(editData?._id ? { _id: editData._id } : {}),
      });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const selPropObj  = properties.find(p => p._id === selProp);
  const selFloorObj = floors.find(f => f._id === selFloor);
  const selUnitObj  = units.find(u => u._id === selUnit);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "rgba(15,23,42,0.72)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, backdropFilter: "blur(8px)",
      animation: "vmFadeIn 0.22s ease-out",
    }}>
      <style>{`
        @keyframes vmFadeIn  { from{opacity:0}              to{opacity:1} }
        @keyframes vmSlideUp { from{transform:translateY(28px);opacity:0} to{transform:translateY(0);opacity:1} }
        .vm-label   { font-size:0.7rem;  font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px; display:block; }
        .vm-ctrl    { font-size:0.85rem; border-radius:8px; border:1.5px solid #e2e8f0; background:#f8fafc; padding:7px 11px; width:100%; outline:none; transition:border-color 0.15s,box-shadow 0.15s; }
        .vm-ctrl:focus     { border-color:#014aad; background:#fff; box-shadow:0 0 0 3px #014aad18; }
        .vm-ctrl:disabled  { opacity:0.6; cursor:not-allowed; background:#f1f5f9; }
        .vm-section { font-size:0.68rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8; padding:10px 0 6px; border-top:1px solid #f1f5f9; margin-top:8px; }
      `}</style>

      <div style={{ width: "100%", maxWidth: "860px", margin: "0 16px", animation: "vmSlideUp 0.32s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 25px 60px -12px rgba(0,0,0,0.4)", overflow: "hidden" }}>

          {/* ── Header ───────────────────────────────────────────────────────── */}
          <div style={{ background: "#1e293b", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h5 style={{ color: "#fff", fontWeight: 700, margin: 0, fontSize: "1.05rem" }}>
                <i className="bi bi-person-badge me-2" style={{ color: "#60a5fa" }} />
                {mode === "create" ? "Register New Visitor" : mode === "edit" ? "Edit Visitor" : "Visitor Details"}
              </h5>
              <p style={{ color: "#94a3b8", margin: "3px 0 0", fontSize: "0.75rem" }}>
                Hierarchical building access control with approval routing
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {mode !== "create" && (
                <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: ss.bg, color: ss.color }}>
                  <i className={`bi ${ss.icon} me-1`} />{formData.status}
                </span>
              )}
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", color: "#fff", width: "32px", height: "32px", cursor: "pointer", fontSize: "1.1rem" }}>×</button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ maxHeight: "74vh", overflowY: "auto", padding: "20px 24px" }}>

              {/* ── APPROVAL INDICATOR ───────────────────────────────────────── */}
              {(selProp || (mode !== "create" && formData.approvalLevel)) && (
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
                      {approvalLevel === "Property Level" && "Visitor request notification → Property Owner"}
                      {approvalLevel === "Floor Level"    && "Visitor request notification → Floor Owner / Admin"}
                      {approvalLevel === "Office Level"   && "Visitor request notification → Office Owner"}
                    </div>
                  </div>
                  <span style={{ background: apc.color, color: "#fff", borderRadius: "20px", padding: "3px 12px", fontSize: "0.68rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {approvalLevel}
                  </span>
                </div>
              )}

              {/* ── STATUS BANNER (non-pending) ───────────────────────────────── */}
              {formData.status !== "Pending" && (
                <div style={{ background: ss.bg, border: `1px solid ${ss.color}30`, borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className={`bi ${ss.icon}`} style={{ color: ss.color, fontSize: "1rem" }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: ss.color }}>{ss.msg}</span>
                </div>
              )}

              {/* ── SECTION 1: Personal Information ──────────────────────────── */}
              <div className="vm-section">Personal Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label className="vm-label">Visitor Name <span style={{ color: "#dc2626" }}>*</span></label>
                  <input className="vm-ctrl" required disabled={isRO} placeholder="Full name..."
                    value={formData.visitorName} onChange={e => set("visitorName", e.target.value)} />
                </div>
                <div>
                  <label className="vm-label">Contact Number <span style={{ color: "#dc2626" }}>*</span></label>
                  <input className="vm-ctrl" type="tel" required disabled={isRO} placeholder="Mobile..."
                    value={formData.visitorContactNumber} onChange={e => set("visitorContactNumber", e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "8px" }}>
                <div>
                  <label className="vm-label">ID Proof Type</label>
                  <select className="vm-ctrl" disabled={isRO} value={formData.idProofType} onChange={e => set("idProofType", e.target.value)}>
                    {ID_PROOF_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="vm-label">ID Number</label>
                  <input className="vm-ctrl" disabled={isRO} placeholder="ID number..."
                    value={formData.idNumber} onChange={e => set("idNumber", e.target.value)} />
                </div>
                <div>
                  <label className="vm-label">Vehicle No <span style={{ color: "#94a3b8", fontWeight: 500, textTransform: "none" }}>(optional)</span></label>
                  <input className="vm-ctrl" disabled={isRO} placeholder="e.g. TS09AB1234"
                    value={formData.vehicleNumber} onChange={e => set("vehicleNumber", e.target.value)} />
                </div>
              </div>

              {/* ── SECTION 2: Location Hierarchy ─────────────────────────────── */}
              {!isOwner && (
                <>
                  <div className="vm-section">Visiting Location</div>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "8px" }}>

                    {/* Property */}
                    <div style={{ marginBottom: "14px" }}>
                      <label className="vm-label">
                        <i className="bi bi-building me-1" style={{ color: "#1d4ed8" }} />
                        Property <span style={{ color: "#dc2626" }}>*</span>
                        <span style={{ marginLeft: "6px", fontSize: "0.62rem", color: "#94a3b8", fontWeight: 500, textTransform: "none" }}>— mandatory</span>
                      </label>
                      <select className="vm-ctrl" required disabled={isRO} value={selProp} onChange={e => handlePropertyChange(e.target.value)}>
                        <option value="">Select Property</option>
                        {properties.map(p => <option key={p._id} value={p._id}>{p.propertyName}</option>)}
                      </select>
                      {selPropObj && (
                        <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
                          <i className="bi bi-geo-alt me-1" style={{ color: "#014aad" }} />{selPropObj.propertyAddress} · {selPropObj.propertyType}
                        </div>
                      )}
                    </div>

                    {/* Floor */}
                    {selProp && (
                      <div style={{ marginBottom: "14px", paddingLeft: "16px", borderLeft: "2px solid #bfdbfe" }}>
                        <label className="vm-label">
                          <i className="bi bi-layers me-1" style={{ color: "#15803d" }} />
                          Floor
                          <span style={{ marginLeft: "6px", fontSize: "0.62rem", color: "#94a3b8", fontWeight: 500, textTransform: "none" }}>— optional (blank = Property-level approval)</span>
                        </label>
                        <select className="vm-ctrl" disabled={isRO} value={selFloor} onChange={e => handleFloorChange(e.target.value)}>
                          <option value="">Select Floor (optional)</option>
                          {floors.map(f => <option key={f._id} value={f._id}>Floor {f.floorNumber}{f.floorName ? ` — ${f.floorName}` : ""}</option>)}
                        </select>
                        {selFloorObj && (
                          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
                            <i className="bi bi-info-circle me-1" />{selFloorObj.totalUnits} units · {selFloorObj.totalSft} sqft
                          </div>
                        )}
                      </div>
                    )}

                    {/* Office/Unit */}
                    {selFloor && (
                      <div style={{ paddingLeft: "32px", borderLeft: "2px solid #e9d5ff" }}>
                        <label className="vm-label">
                          <i className="bi bi-door-open me-1" style={{ color: "#7e22ce" }} />
                          Office / Unit
                          <span style={{ marginLeft: "6px", fontSize: "0.62rem", color: "#94a3b8", fontWeight: 500, textTransform: "none" }}>— optional (blank = Floor-level approval)</span>
                        </label>
                        <select className="vm-ctrl" disabled={isRO} value={selUnit} onChange={e => setSelUnit(e.target.value)}>
                          <option value="">Select Office / Unit (optional)</option>
                          {units.map(u => <option key={u._id} value={u._id}>Unit {u.unitNumber}{u.ownerName ? ` — ${u.ownerName}` : ""} ({u.unitStatus})</option>)}
                        </select>
                        {selUnitObj && (
                          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
                            <i className="bi bi-person me-1" />{selUnitObj.ownerName || "No owner"} · {selUnitObj.unitType} · {selUnitObj.sqft} sqft
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── SECTION 3: Visit Details ──────────────────────────────────── */}
              <div className="vm-section">Visit Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label className="vm-label">Person to Meet <span style={{ color: "#dc2626" }}>*</span></label>
                  <input className="vm-ctrl" required disabled={isRO} placeholder="Name of host..."
                    value={formData.personToMeet} onChange={e => set("personToMeet", e.target.value)} />
                </div>
                <div>
                  <label className="vm-label">Purpose of Visit <span style={{ color: "#dc2626" }}>*</span></label>
                  <select className="vm-ctrl" disabled={isRO} value={formData.purposeOfVisit} onChange={e => set("purposeOfVisit", e.target.value)}>
                    {PURPOSE_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="vm-label">Visit Date</label>
                  <input className="vm-ctrl" type="date" disabled={isRO}
                    value={formData.visitDate} onChange={e => set("visitDate", e.target.value)} />
                </div>
                <div>
                  <label className="vm-label">In-Time</label>
                  <input className="vm-ctrl" type="time" disabled={isRO}
                    value={formData.inTime} onChange={e => set("inTime", e.target.value)} />
                </div>
                <div>
                  <label className="vm-label">Out-Time <span style={{ color: "#94a3b8", fontWeight: 500, textTransform: "none" }}>(optional)</span></label>
                  <input className="vm-ctrl" type="time" disabled={isRO}
                    value={formData.outTime || ""} onChange={e => set("outTime", e.target.value)} />
                </div>
              </div>

              {/* ── SECTION 4: Status (edit only) ────────────────────────────── */}
              {mode !== "create" && (
                <>
                  <div className="vm-section">Visitor Status</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "8px" }}>
                    <div>
                      <label className="vm-label">Status</label>
                      <select className="vm-ctrl" disabled={isRO}
                        value={formData.status} onChange={e => set("status", e.target.value)}>
                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    {formData.status === "Rejected" && (
                      <div>
                        <label className="vm-label">Rejection Reason</label>
                        <input className="vm-ctrl" disabled={isRO} placeholder="Reason..."
                          value={formData.rejectionReason || ""} onChange={e => set("rejectionReason", e.target.value)} />
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>

            {/* ── Footer ───────────────────────────────────────────────────────── */}
            <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <i className={`bi ${apc.icon}`} style={{ color: apc.color, fontSize: "0.9rem" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: apc.color }}>
                  {selProp ? apc.label : "Select a property to determine approval routing"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={onClose} disabled={isSubmitting}
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", color: "#64748b" }}>
                  {isRO ? "Close" : "Cancel"}
                </button>
                {!isRO && (
                  <button type="submit" disabled={isSubmitting}
                    style={{ padding: "8px 24px", borderRadius: "8px", border: "none", background: "#014aad", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    {isSubmitting && <span className="spinner-border spinner-border-sm" role="status" />}
                    <i className="bi bi-send-fill" />
                    {mode === "create" ? "Register Visitor" : "Update Visitor"}
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
