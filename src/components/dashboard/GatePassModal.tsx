"use client";

import { useState, useEffect } from "react";
import { ModalMode } from "./AssetModal";
import { api } from "@/utils/api";

interface GatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

// ── Approval level config ──────────────────────────────────────────────────────
const APPROVAL_CFG = {
  "Property Level": { icon: "bi-building",      bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", label: "Property Owner Approval" },
  "Floor Level":    { icon: "bi-layers",         bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Floor Owner / Admin Approval" },
  "Office Level":   { icon: "bi-door-open",      bg: "#fdf4ff", border: "#e9d5ff", color: "#7e22ce", label: "Office Owner Approval" },
} as const;

type ApprovalLevel = keyof typeof APPROVAL_CFG;

const EMPTY_FORM = {
  gatePassType:   "Inward",
  materialDetails:"",
  hsnCode:        "",
  quantity:       1,
  rate:           "",
  totalCost:      "",
  placeOfVisit:   "",
  purposeOfVisit: "",
  vehicleNumber:  "",
  inTime:         "",
  status:         "Pending",
};

export default function GatePassModal({ isOpen, onClose, onSave, editData, mode }: GatePassModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Hierarchy data ──────────────────────────────────────────────────────────
  const [properties,      setProperties]      = useState<any[]>([]);
  const [floors,          setFloors]           = useState<any[]>([]);
  const [units,           setUnits]            = useState<any[]>([]);

  // ── Selected IDs ───────────────────────────────────────────────────────────
  const [selProperty, setSelProperty] = useState("");
  const [selFloor,    setSelFloor]    = useState("");
  const [selUnit,     setSelUnit]     = useState("");

  // ── Derived approval level ──────────────────────────────────────────────────
  const approvalLevel: ApprovalLevel =
    selUnit     ? "Office Level"   :
    selFloor    ? "Floor Level"    :
    selProperty ? "Property Level" : "Property Level";

  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  // ── Load properties on open ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    api.get("/properties").then(r => { if (r.success) setProperties(r.data); });
  }, [isOpen]);

  // ── Populate form when editing ──────────────────────────────────────────────
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

  // ── Auto total cost ─────────────────────────────────────────────────────────
  useEffect(() => {
    const r = parseFloat(String(formData.rate));
    const q = parseInt(String(formData.quantity));
    if (!isNaN(r) && !isNaN(q) && mode !== "view") {
      setFormData(p => ({ ...p, totalCost: String(r * q) }));
    }
  }, [formData.rate, formData.quantity, mode]);

  // ── Property change → load floors ──────────────────────────────────────────
  const handlePropertyChange = async (propId: string) => {
    setSelProperty(propId); setSelFloor(""); setSelUnit("");
    setFloors([]); setUnits([]);
    if (!propId) return;
    try {
      const r = await api.get(`/floors?property=${propId}`);
      if (r.success) setFloors(r.data);
    } catch { /* silent */ }
  };

  // ── Floor change → load units ───────────────────────────────────────────────
  const handleFloorChange = async (floorId: string) => {
    setSelFloor(floorId); setSelUnit(""); setUnits([]);
    if (!floorId) return;
    try {
      const r = await api.get(`/units?floor=${floorId}`);
      if (r.success) setUnits(r.data);
    } catch { /* silent */ }
  };

  const handleUnitChange = (unitId: string) => setSelUnit(unitId);

  // ── Submit ──────────────────────────────────────────────────────────────────
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

  // ── Selected labels for display ─────────────────────────────────────────────
  const selPropertyObj = properties.find(p => p._id === selProperty);
  const selFloorObj    = floors.find(f => f._id === selFloor);
  const selUnitObj     = units.find(u => u._id === selUnit);

  return (
    <div style={{
      position:"fixed",top:0,left:0,right:0,bottom:0,
      backgroundColor:"rgba(15,23,42,0.75)",display:"flex",
      alignItems:"center",justifyContent:"center",zIndex:9999,
      backdropFilter:"blur(8px)",animation:"fadeIn 0.25s ease-out",
    }}>
      <style>{`
        @keyframes fadeIn  { from{opacity:0}         to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        .gp-label { font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; display:block; }
        .gp-control { font-size:0.85rem; border-radius:8px; border:1.5px solid #e2e8f0; background:#f8fafc; padding:7px 11px; width:100%; outline:none; transition:border-color 0.15s; }
        .gp-control:focus { border-color:#014aad; background:#fff; }
        .gp-control:disabled { opacity:0.6; cursor:not-allowed; }
        .gp-section { font-size:0.7rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8; padding:10px 0 6px; border-top:1px solid #f1f5f9; margin-top:8px; }
      `}</style>

      <div style={{ width:"100%", maxWidth:"820px", margin:"0 16px", animation:"slideUp 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ background:"#fff", borderRadius:"16px", boxShadow:"0 25px 50px -12px rgba(0,0,0,0.35)", overflow:"hidden" }}>

          {/* ── Header ───────────────────────────────────────────────────────── */}
          <div style={{ background:"#1e293b", padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <h5 style={{ color:"#fff", fontWeight:700, margin:0, fontSize:"1.05rem" }}>
                <i className="bi bi-card-checklist me-2" style={{ color:"#60a5fa" }} />
                {mode === "create" ? "Create Gate Pass" : mode === "edit" ? "Edit Gate Pass" : "View Gate Pass"}
              </h5>
              <p style={{ color:"#94a3b8", margin:"2px 0 0", fontSize:"0.75rem" }}>
                Material movement approval with hierarchy-based routing
              </p>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:"8px", color:"#fff", width:"32px", height:"32px", cursor:"pointer", fontSize:"1.1rem", display:"flex", alignItems:"center", justifyContent:"center" }}>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ maxHeight:"72vh", overflowY:"auto", padding:"20px 24px" }}>

              {/* ── APPROVAL LEVEL INDICATOR ─────────────────────────────────── */}
              {(selProperty || mode !== "create") && (
                <div style={{
                  background: apc.bg, border:`1.5px solid ${apc.border}`,
                  borderRadius:"10px", padding:"12px 16px", marginBottom:"20px",
                  display:"flex", alignItems:"center", gap:"12px"
                }}>
                  <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:apc.color + "20", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <i className={`bi ${apc.icon}`} style={{ color:apc.color, fontSize:"1.1rem" }} />
                  </div>
                  <div>
                    <div style={{ fontSize:"0.65rem", fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase", color:apc.color, marginBottom:"1px" }}>
                      Approval Routing
                    </div>
                    <div style={{ fontSize:"0.88rem", fontWeight:700, color:apc.color }}>
                      {apc.label}
                    </div>
                    <div style={{ fontSize:"0.7rem", color:apc.color + "bb", marginTop:"1px" }}>
                      {approvalLevel === "Property Level" && "Notification will be sent to the Property Owner"}
                      {approvalLevel === "Floor Level"    && "Notification will be sent to the Floor Owner / Admin"}
                      {approvalLevel === "Office Level"   && "Notification will be sent to the Office Owner"}
                    </div>
                  </div>
                  <div style={{ marginLeft:"auto", background:apc.color, color:"#fff", borderRadius:"20px", padding:"3px 12px", fontSize:"0.68rem", fontWeight:700, whiteSpace:"nowrap" }}>
                    {approvalLevel}
                  </div>
                </div>
              )}

              {/* ── SECTION 1: Material Information ──────────────────────────── */}
              <div className="gp-section">Material Information</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"12px", marginBottom:"12px" }}>
                <div>
                  <label className="gp-label">Gate Pass Type <span style={{ color:"#dc2626" }}>*</span></label>
                  <select className="gp-control" disabled={isRO}
                    value={formData.gatePassType}
                    onChange={e => setFormData(p => ({ ...p, gatePassType: e.target.value }))}>
                    <option value="Inward">⬇ Inward</option>
                    <option value="Outward">⬆ Outward</option>
                  </select>
                </div>
                <div>
                  <label className="gp-label">Material Details <span style={{ color:"#dc2626" }}>*</span></label>
                  <input className="gp-control" required disabled={isRO}
                    placeholder="Describe the material..."
                    value={formData.materialDetails}
                    onChange={e => setFormData(p => ({ ...p, materialDetails: e.target.value }))} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"12px", marginBottom:"8px" }}>
                <div>
                  <label className="gp-label">HSN Code</label>
                  <input className="gp-control" disabled={isRO} placeholder="HSN..."
                    value={formData.hsnCode}
                    onChange={e => setFormData(p => ({ ...p, hsnCode: e.target.value }))} />
                </div>
                <div>
                  <label className="gp-label">Quantity <span style={{ color:"#dc2626" }}>*</span></label>
                  <input className="gp-control" type="number" min="1" required disabled={isRO}
                    value={formData.quantity}
                    onChange={e => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
                </div>
                <div>
                  <label className="gp-label">Rate (₹)</label>
                  <input className="gp-control" type="number" disabled={isRO} placeholder="0"
                    value={formData.rate}
                    onChange={e => setFormData(p => ({ ...p, rate: e.target.value }))} />
                </div>
                <div>
                  <label className="gp-label">Total Cost (₹)</label>
                  <input className="gp-control" disabled style={{ fontWeight:700, color:"#1e293b" }}
                    value={formData.totalCost ? `₹ ${Number(formData.totalCost).toLocaleString()}` : ""} readOnly />
                </div>
              </div>

              {/* ── SECTION 2: Location Hierarchy ────────────────────────────── */}
              <div className="gp-section">Location Hierarchy</div>
              <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:"12px", padding:"16px", marginBottom:"8px" }}>

                {/* Step 1 — Property (always shown) */}
                <div style={{ marginBottom:"14px" }}>
                  <label className="gp-label">
                    <i className="bi bi-building me-1" style={{ color:"#1d4ed8" }} />
                    Property <span style={{ color:"#dc2626" }}>*</span>
                    <span style={{ marginLeft:"8px", fontSize:"0.65rem", color:"#94a3b8", fontWeight:500, textTransform:"none" }}>
                      — mandatory
                    </span>
                  </label>
                  <select className="gp-control" required disabled={isRO}
                    value={selProperty}
                    onChange={e => handlePropertyChange(e.target.value)}>
                    <option value="">Select Property</option>
                    {properties.map(p => (
                      <option key={p._id} value={p._id}>{p.propertyName}</option>
                    ))}
                  </select>
                  {selPropertyObj && (
                    <div style={{ fontSize:"0.7rem", color:"#64748b", marginTop:"4px" }}>
                      <i className="bi bi-geo-alt me-1" style={{ color:"#014aad" }} />
                      {selPropertyObj.propertyAddress} · {selPropertyObj.propertyType}
                    </div>
                  )}
                </div>

                {/* Step 2 — Floor (shown only after property selected) */}
                {selProperty && (
                  <div style={{ marginBottom:"14px", paddingLeft:"16px", borderLeft:"2px solid #bfdbfe" }}>
                    <label className="gp-label">
                      <i className="bi bi-layers me-1" style={{ color:"#15803d" }} />
                      Floor
                      <span style={{ marginLeft:"8px", fontSize:"0.65rem", color:"#94a3b8", fontWeight:500, textTransform:"none" }}>
                        — optional (leave blank for Property-level approval)
                      </span>
                    </label>
                    <select className="gp-control" disabled={isRO}
                      value={selFloor}
                      onChange={e => handleFloorChange(e.target.value)}>
                      <option value="">Select Floor (optional)</option>
                      {floors.map(f => (
                        <option key={f._id} value={f._id}>
                          Floor {f.floorNumber}{f.floorName ? ` — ${f.floorName}` : ""}
                        </option>
                      ))}
                    </select>
                    {selFloorObj && (
                      <div style={{ fontSize:"0.7rem", color:"#64748b", marginTop:"4px" }}>
                        <i className="bi bi-info-circle me-1" />
                        {selFloorObj.totalUnits} units · {selFloorObj.totalSft} sqft
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3 — Office/Unit (shown only after floor selected) */}
                {selFloor && (
                  <div style={{ paddingLeft:"32px", borderLeft:"2px solid #e9d5ff" }}>
                    <label className="gp-label">
                      <i className="bi bi-door-open me-1" style={{ color:"#7e22ce" }} />
                      Office / Unit
                      <span style={{ marginLeft:"8px", fontSize:"0.65rem", color:"#94a3b8", fontWeight:500, textTransform:"none" }}>
                        — optional (leave blank for Floor-level approval)
                      </span>
                    </label>
                    <select className="gp-control" disabled={isRO}
                      value={selUnit}
                      onChange={e => handleUnitChange(e.target.value)}>
                      <option value="">Select Office / Unit (optional)</option>
                      {units.map(u => (
                        <option key={u._id} value={u._id}>
                          Unit {u.unitNumber}{u.ownerName ? ` — ${u.ownerName}` : ""} ({u.unitStatus})
                        </option>
                      ))}
                    </select>
                    {selUnitObj && (
                      <div style={{ fontSize:"0.7rem", color:"#64748b", marginTop:"4px" }}>
                        <i className="bi bi-person me-1" />
                        {selUnitObj.ownerName || "No owner"} · {selUnitObj.unitType} · {selUnitObj.sqft} sqft
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── SECTION 3: Movement Details ───────────────────────────────── */}
              <div className="gp-section">Movement Details</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
                <div>
                  <label className="gp-label">Place of Visit</label>
                  <input className="gp-control" disabled={isRO} placeholder="Destination..."
                    value={formData.placeOfVisit}
                    onChange={e => setFormData(p => ({ ...p, placeOfVisit: e.target.value }))} />
                </div>
                <div>
                  <label className="gp-label">Purpose</label>
                  <input className="gp-control" disabled={isRO} placeholder="Reason for movement..."
                    value={formData.purposeOfVisit}
                    onChange={e => setFormData(p => ({ ...p, purposeOfVisit: e.target.value }))} />
                </div>
                <div>
                  <label className="gp-label">Vehicle No</label>
                  <input className="gp-control" disabled={isRO} placeholder="Optional..."
                    value={formData.vehicleNumber}
                    onChange={e => setFormData(p => ({ ...p, vehicleNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="gp-label">In Time</label>
                  <input className="gp-control" disabled={isRO}
                    value={formData.inTime}
                    onChange={e => setFormData(p => ({ ...p, inTime: e.target.value }))} />
                </div>
              </div>
              {mode !== "create" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"12px" }}>
                  <div>
                    <label className="gp-label">Status</label>
                    <select className="gp-control" disabled={isRO}
                      value={formData.status}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Cleared">Cleared</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              )}

            </div>

            {/* ── Footer ───────────────────────────────────────────────────────── */}
            <div style={{ background:"#f8fafc", borderTop:"1px solid #e2e8f0", padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              {/* Approval pill */}
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <i className={`bi ${apc.icon}`} style={{ color:apc.color, fontSize:"0.9rem" }} />
                <span style={{ fontSize:"0.75rem", fontWeight:700, color:apc.color }}>
                  {selProperty ? apc.label : "Select a property to determine approval routing"}
                </span>
              </div>
              <div style={{ display:"flex", gap:"10px" }}>
                <button type="button"
                  onClick={onClose} disabled={isSubmitting}
                  style={{ padding:"8px 20px", borderRadius:"8px", border:"1.5px solid #e2e8f0", background:"#fff", fontWeight:700, fontSize:"0.85rem", cursor:"pointer", color:"#64748b" }}>
                  {mode === "view" ? "Close" : "Cancel"}
                </button>
                {mode !== "view" && (
                  <button type="submit" disabled={isSubmitting}
                    style={{ padding:"8px 24px", borderRadius:"8px", border:"none", background:"#014aad", color:"#fff", fontWeight:700, fontSize:"0.85rem", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px" }}>
                    {isSubmitting && <span className="spinner-border spinner-border-sm" role="status" />}
                    <i className="bi bi-send-fill" />
                    {mode === "create" ? "Submit Gate Pass" : "Update Gate Pass"}
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
