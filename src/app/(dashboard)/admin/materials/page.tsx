"use client";

import { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";
import GatePassModal from "@/components/dashboard/GatePassModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

function MaterialsContent() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedGatePass, setSelectedGatePass] = useState<any>(null);

  // View detail drawer
  const [viewItem, setViewItem] = useState<any>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchMaterials();
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/materials");
      if (response.success) setMaterials(response.data);
    } catch (err) {
      console.error("Failed to fetch materials:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (mode: ModalMode, item: any = null) => {
    if (mode === "view") { setViewItem(item); return; }
    setModalMode(mode);
    setSelectedGatePass(item);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      const response =
        modalMode === "edit"
          ? await api.put(`/materials/${data._id}`, data)
          : await api.post("/materials", data);
      if (response.success) fetchMaterials();
    } catch (err) {
      console.error("Failed to save gate pass:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this gate pass?")) {
      try {
        const response = await api.delete(`/materials/${id}`);
        if (response.success) fetchMaterials();
      } catch (err) {
        console.error("Failed to delete gate pass:", err);
      }
    }
  };

  const filteredMaterials = materials.filter((item) => {
    const isOwner = currentUser?.role === "Owner" || currentUser?.role === "Office Owner";
    if (isOwner) {
      const ownerUnitIds = (currentUser.assignedUnits || []).map((u: any) => (u._id || u).toString());
      const passUnitId = (item.unit?._id || item.unit || "").toString();
      const unitMatch = ownerUnitIds.includes(passUnitId);
      const creatorMatch = item.createdBy === currentUser._id;
      if (!unitMatch && !creatorMatch) return false;
    }

    const prop  = item.property?.propertyName || item.building || "";
    const floor = item.floor?.floorName || item.floor?.floorNumber || "";
    const unit  = item.unit?.unitNumber  || item.unitLabel || "";
    const mat   = item.materialDetails   || "";
    const s     = searchTerm.toLowerCase();
    return prop.toLowerCase().includes(s) || floor.toLowerCase().includes(s) ||
           unit.toLowerCase().includes(s) || mat.toLowerCase().includes(s);
  });

  // ── Shared thead cell style ─────────────────────────────────────────────────
  const thStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 9,
    fontSize: "0.72rem",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    border: "none",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    padding: "12px 14px",
    whiteSpace: "nowrap",
  };

  const statusCfg: Record<string, { bg: string; color: string }> = {
    Approved: { bg: "#dcfce7", color: "#166534" },
    Cleared:  { bg: "#dbeafe", color: "#1e40af" },
    Rejected: { bg: "#fee2e2", color: "#991b1b" },
    Pending:  { bg: "#fef9c3", color: "#854d0e" },
  };

  return (
    <div className="container-fluid p-0">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: "-0.02em", fontSize: "1.5rem" }}>
            Material Management
          </h2>
          <p className="text-muted small mb-0">Track inward and outward material movement with gate passes.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-outline-secondary btn-sm rounded px-3 fw-bold bg-white shadow-sm d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem", height: "36px" }}
          >
            <i className="bi bi-download" /> Export
          </button>
          <button
            className="btn btn-sm rounded px-3 shadow-sm fw-bold text-white border-0 d-flex align-items-center gap-2"
            style={{ backgroundColor: "#014aad", fontSize: "0.85rem", height: "36px" }}
            onClick={() => handleOpenModal("create")}
          >
            <i className="bi bi-plus-circle" /> New Gate Pass
          </button>
        </div>
      </div>

      {/* ── Search & Filter Bar ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-3 shadow-sm border px-3 py-2 mb-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "320px" }}>
          <i className="bi bi-search text-muted" />
          <input
            type="text"
            className="border-0 bg-transparent w-100 shadow-none small"
            placeholder="Search by material, building, unit, office..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ outline: "none", fontSize: "0.85rem" }}
          />
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium"
            style={{ fontSize: "0.75rem", minWidth: "130px" }}
          >
            <option>Type: All</option>
            <option>Inward</option>
            <option>Outward</option>
          </select>
          <select
            className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium"
            style={{ fontSize: "0.75rem", minWidth: "130px" }}
          >
            <option>Status: All</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Cleared</option>
            <option>Rejected</option>
          </select>
          <button
            className="btn btn-light btn-sm border rounded-pill px-3 shadow-none fw-bold text-muted d-flex align-items-center gap-2"
            style={{ fontSize: "0.75rem" }}
          >
            <i className="bi bi-arrow-clockwise" /> Reset
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0 align-middle" style={{ width: "100%", borderCollapse: "collapse" }}>

            <thead>
              <tr>
                <th style={thStyle}>Gate Pass Type</th>
                <th style={thStyle}>Material Details</th>
                <th style={thStyle}>Location / Office</th>
                <th style={thStyle}>Quantity / Rate</th>
                <th style={thStyle}>Total Cost</th>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Loading gate passes...
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted" style={{ fontSize: "0.9rem" }}>
                    <i className="bi bi-inbox me-2" />No gate passes found.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((item, index) => {
                  const { bg, color } = statusCfg[item.status] || statusCfg["Pending"];
                  return (
                    <tr
                      key={item._id}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: "0.85rem",
                      }}
                    >
                      {/* Gate Pass Type */}
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          className="badge rounded-pill fw-bold px-2 py-1"
                          style={{
                            backgroundColor: item.gatePassType === "Inward" ? "#dcfce7" : "#dbeafe",
                            color: item.gatePassType === "Inward" ? "#166534" : "#1e40af",
                            fontSize: "0.7rem",
                          }}
                        >
                          {item.gatePassType === "Inward" ? "⬇ Inward" : "⬆ Outward"}
                        </span>
                      </td>

                      {/* Material Details */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.85rem" }}>
                          {item.materialDetails}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                          HSN: {item.hsnCode || "N/A"}
                        </div>
                      </td>

                      {/* Location / Office */}
                      <td style={{ padding: "10px 14px", minWidth: "180px" }}>
                        {/* Property */}
                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.83rem" }}>
                          <i className="bi bi-building me-1" style={{ color: "#014aad" }} />
                          {item.property?.propertyName || item.building || "—"}
                        </div>
                        {/* Floor */}
                        {(item.floor?.floorNumber || item.floorLabel) && (
                          <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "3px" }}>
                            <i className="bi bi-layers me-1" style={{ color: "#0284c7" }} />
                            Floor {item.floor?.floorNumber || item.floorLabel}
                            {item.floor?.floorName ? ` — ${item.floor.floorName}` : ""}
                          </div>
                        )}
                        {/* Unit / Office */}
                        {(item.unit?.unitNumber || item.unitLabel) && (
                          <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "2px" }}>
                            <i className="bi bi-door-open me-1" style={{ color: "#7c3aed" }} />
                            Unit {item.unit?.unitNumber || item.unitLabel}
                            {item.unit?.ownerName || item.officeName
                              ? ` · ${item.unit?.ownerName || item.officeName}` : ""}
                          </div>
                        )}
                        {/* Approval level pill */}
                        {item.approvalLevel && (
                          <div style={{ marginTop: "4px" }}>
                            <span style={{
                              fontSize: "0.6rem", fontWeight: 700, padding: "1px 7px", borderRadius: "20px",
                              background: item.approvalLevel === "Office Level" ? "#f3e8ff" : item.approvalLevel === "Floor Level" ? "#dcfce7" : "#dbeafe",
                              color:      item.approvalLevel === "Office Level" ? "#7e22ce" : item.approvalLevel === "Floor Level" ? "#166534" : "#1d4ed8",
                            }}>
                              {item.approvalLevel}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Quantity / Rate */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#1e293b" }}>{item.quantity} units</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>@ ₹{item.rate}</div>
                      </td>

                      {/* Total Cost */}
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1e293b" }}>
                        ₹{item.totalCost?.toLocaleString() || "0"}
                      </td>

                      {/* Time */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontSize: "0.82rem" }}>
                          <span style={{ color: "#16a34a", fontWeight: 600 }}>In: </span>
                          <span style={{ color: "#1e293b" }}>{item.inTime || "—"}</span>
                        </div>
                        {item.outTime && item.outTime !== "-" && (
                          <div style={{ fontSize: "0.82rem", marginTop: "2px" }}>
                            <span style={{ color: "#dc2626", fontWeight: 600 }}>Out: </span>
                            <span style={{ color: "#1e293b" }}>{item.outTime}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          className="badge rounded-pill fw-bold px-2 py-1"
                          style={{ backgroundColor: bg, color, fontSize: "0.7rem" }}
                        >
                          {item.status || "Pending"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <div className="d-flex gap-2 justify-content-center align-items-center">
                          <button
                            className="btn btn-link p-0"
                            title="View"
                            onClick={() => handleOpenModal("view", item)}
                          >
                            <i className="bi bi-eye-fill" style={{ fontSize: "1.05rem", color: "#4b5563" }} />
                          </button>
                          <button
                            className="btn btn-link p-0"
                            title="Edit"
                            onClick={() => handleOpenModal("edit", item)}
                          >
                            <i className="bi bi-pencil-square" style={{ fontSize: "1.05rem", color: "#014aad" }} />
                          </button>
                          <button
                            className="btn btn-link p-0"
                            title="Print"
                          >
                            <i className="bi bi-printer" style={{ fontSize: "1.05rem", color: "#64748b" }} />
                          </button>
                          <button
                            className="btn btn-link p-0"
                            title="Delete"
                            onClick={() => handleDelete(item._id)}
                          >
                            <i className="bi bi-trash" style={{ fontSize: "1.05rem", color: "#dc2626" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* ── Pagination Footer ─────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-top d-flex justify-content-between align-items-center bg-white">
          <span className="text-muted small">
            Showing 1–{filteredMaterials.length} of {materials.length} entries
          </span>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-white border px-2 shadow-none" disabled>
              <i className="bi bi-chevron-left" />
            </button>
            <button
              className="btn btn-sm border-0 px-3 shadow-none text-white fw-bold"
              style={{ backgroundColor: "#014aad", borderRadius: "6px" }}
            >
              1
            </button>
            <button className="btn btn-sm btn-white border px-2 shadow-none">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Gate Pass Modal ───────────────────────────────────────────────────── */}
      <GatePassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editData={selectedGatePass}
        mode={modalMode}
      />

      {/* ── View Detail Drawer ────────────────────────────────────────────────── */}
      {viewItem && (
        <div style={{
          position:"fixed",top:0,left:0,right:0,bottom:0,
          backgroundColor:"rgba(15,23,42,0.6)",zIndex:9999,
          display:"flex",justifyContent:"flex-end",
          backdropFilter:"blur(4px)",animation:"fadeIn 0.2s ease",
        }} onClick={() => setViewItem(null)}>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
          <div style={{
            width:"520px",height:"100%",background:"#fff",overflowY:"auto",
            boxShadow:"-20px 0 60px rgba(0,0,0,0.2)",animation:"slideIn 0.3s cubic-bezier(0.4,0,0.2,1)",
          }} onClick={e => e.stopPropagation()}>

            {/* Drawer Header */}
            <div style={{ background:"#1e293b",padding:"20px 24px",position:"sticky",top:0,zIndex:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.08em",color:"#60a5fa",textTransform:"uppercase" }}>Gate Pass Detail</div>
                  <h5 style={{ color:"#fff",margin:"4px 0 0",fontWeight:700,fontSize:"1rem" }}>{viewItem.materialDetails}</h5>
                </div>
                <button onClick={() => setViewItem(null)} style={{ background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"8px",color:"#fff",width:"32px",height:"32px",cursor:"pointer",fontSize:"1.2rem" }}>×</button>
              </div>
              {/* Status + Type row */}
              <div style={{ display:"flex",gap:"8px",marginTop:"12px",flexWrap:"wrap" }}>
                <span style={{ fontSize:"0.7rem",fontWeight:700,padding:"3px 10px",borderRadius:"20px",background:viewItem.gatePassType==="Inward"?"#dcfce7":"#dbeafe",color:viewItem.gatePassType==="Inward"?"#166534":"#1e40af" }}>
                  {viewItem.gatePassType==="Inward"?"⬇ Inward":"⬆ Outward"}
                </span>
                {(() => { const c: Record<string, { bg: string; cl: string }> ={Approved:{bg:"#dcfce7",cl:"#166534"},Cleared:{bg:"#dbeafe",cl:"#1e40af"},Rejected:{bg:"#fee2e2",cl:"#991b1b"},Pending:{bg:"#fef9c3",cl:"#854d0e"}}; const s=c[viewItem.status]||c.Pending; return(
                  <span style={{ fontSize:"0.7rem",fontWeight:700,padding:"3px 10px",borderRadius:"20px",background:s.bg,color:s.cl }}>{viewItem.status||"Pending"}</span>
                ); })()}
                {viewItem.approvalLevel && (
                  <span style={{ fontSize:"0.7rem",fontWeight:700,padding:"3px 10px",borderRadius:"20px",background:"rgba(255,255,255,0.15)",color:"#e2e8f0" }}>{viewItem.approvalLevel}</span>
                )}
              </div>
            </div>

            <div style={{ padding:"20px 24px",display:"flex",flexDirection:"column",gap:"16px" }}>

              {/* Material Info */}
              <Section title="Material Information" icon="bi-box-seam">
                <Row label="Details"    value={viewItem.materialDetails} />
                <Row label="HSN Code"   value={viewItem.hsnCode || "N/A"} />
                <Row label="Quantity"   value={`${viewItem.quantity} units`} />
                <Row label="Rate"       value={`₹ ${Number(viewItem.rate||0).toLocaleString()}`} />
                <Row label="Total Cost" value={`₹ ${Number(viewItem.totalCost||0).toLocaleString()}`} highlight />
              </Section>

              {/* Property Details */}
              {viewItem.property && (
                <Section title="Property Details" icon="bi-building" accent="#1d4ed8">
                  <Row label="Property" value={viewItem.property?.propertyName} />
                  <Row label="Address"  value={viewItem.property?.propertyAddress} />
                  <Row label="Type"     value={viewItem.property?.propertyType} />
                </Section>
              )}

              {/* Floor Details */}
              {viewItem.floor && (
                <Section title="Floor Details" icon="bi-layers" accent="#0284c7">
                  <Row label="Floor No"    value={`Floor ${viewItem.floor?.floorNumber}`} />
                  <Row label="Floor Name"  value={viewItem.floor?.floorName || "—"} />
                  <Row label="Total Units" value={viewItem.floor?.totalUnits ?? "—"} />
                  <Row label="Total SqFt"  value={viewItem.floor?.totalSft ? `${viewItem.floor.totalSft} sqft` : "—"} />
                  {viewItem.floor?.assignedAdmin && (
                    <>
                      <Divider label="Floor Admin" />
                      <Row label="Name"  value={viewItem.floor.assignedAdmin.name} />
                      <Row label="Email" value={viewItem.floor.assignedAdmin.email || "—"} />
                      <Row label="Phone" value={viewItem.floor.assignedAdmin.phone || "—"} />
                      <Row label="Role"  value={viewItem.floor.assignedAdmin.role  || "—"} />
                    </>
                  )}
                  {viewItem.floor?.assignedOwner && (
                    <>
                      <Divider label="Floor Owner" />
                      <Row label="Owner Name"     value={viewItem.floor.assignedOwner.ownerName} />
                      <Row label="Contact"        value={viewItem.floor.assignedOwner.contactNumber   || "—"} />
                      <Row label="Alternate No"   value={viewItem.floor.assignedOwner.alternateNumber || "—"} />
                      <Row label="Email"          value={viewItem.floor.assignedOwner.emailId         || "—"} />
                      <Row label="Contact Person" value={viewItem.floor.assignedOwner.contactPerson   || "—"} />
                      <Row label="Designation"    value={viewItem.floor.assignedOwner.designation     || "—"} />
                    </>
                  )}
                </Section>
              )}

              {/* Office / Unit Details */}
              {viewItem.unit && (
                <Section title="Office / Unit Details" icon="bi-door-open" accent="#7c3aed">
                  <Row label="Unit No"   value={viewItem.unit?.unitNumber} />
                  <Row label="Unit Type" value={viewItem.unit?.unitType} />
                  <Row label="Status"    value={viewItem.unit?.unitStatus} />
                  <Row label="Area"      value={viewItem.unit?.sqft ? `${viewItem.unit.sqft} sqft` : "—"} />
                  {(viewItem.unit?.owner || viewItem.unit?.ownerName) && (
                    <>
                      <Divider label="Office Owner" />
                      <Row label="Owner Name"     value={viewItem.unit?.owner?.ownerName    || viewItem.unit?.ownerName} />
                      <Row label="Contact"        value={viewItem.unit?.owner?.contactNumber    || "—"} />
                      <Row label="Alternate No"   value={viewItem.unit?.owner?.alternateNumber  || "—"} />
                      <Row label="Email"          value={viewItem.unit?.owner?.emailId           || "—"} />
                      <Row label="Contact Person" value={viewItem.unit?.owner?.contactPerson    || "—"} />
                      <Row label="Designation"    value={viewItem.unit?.owner?.designation       || "—"} />
                      <Row label="Owner Type"     value={viewItem.unit?.owner?.ownerType          || "—"} />
                    </>
                  )}
                </Section>
              )}

              {/* Movement Details */}
              <Section title="Movement Details" icon="bi-truck">
                <Row label="Place of Visit" value={viewItem.placeOfVisit   || "—"} />
                <Row label="Purpose"        value={viewItem.purposeOfVisit  || "—"} />
                <Row label="Vehicle No"     value={viewItem.vehicleNumber   || "—"} />
                <Row label="In Time"        value={viewItem.inTime  || "—"} />
                <Row label="Out Time"       value={(viewItem.outTime && viewItem.outTime !== "-") ? viewItem.outTime : "—"} />
              </Section>

              {/* Created By */}
              <Section title="Created By" icon="bi-person-plus" accent="#0284c7">
                {viewItem.createdBy ? (
                  <>
                    <Row label="Name"  value={viewItem.createdBy.name} />
                    <Row label="Email" value={viewItem.createdBy.email || "—"} />
                    <Row label="Phone" value={viewItem.createdBy.phone || "—"} />
                    <Row label="Role"  value={viewItem.createdBy.role  || "—"} />
                  </>
                ) : <Row label="Created By" value="—" />}
                <Row label="Created At" value={viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString() : "—"} />
              </Section>

              {/* Approval Decision — always visible */}
              {(() => {
                const isPending  = !viewItem.status || viewItem.status === 'Pending';
                const isApproved = viewItem.status === 'Approved';
                const isCleared  = viewItem.status === 'Cleared';
                const isRejected = viewItem.status === 'Rejected';

                const accent = isRejected ? '#dc2626' : isCleared ? '#0284c7' : isApproved ? '#059669' : '#94a3b8';
                const title  = isRejected ? 'Rejected By' : 'Approved By';
                const icon   = isRejected ? 'bi-x-octagon' : isPending ? 'bi-hourglass-split' : 'bi-patch-check-fill';

                const badgeBg  = isRejected ? '#fee2e2' : isCleared ? '#dbeafe' : isApproved ? '#dcfce7' : '#f1f5f9';
                const badgeCl  = isRejected ? '#991b1b' : isCleared ? '#1e40af' : isApproved ? '#166534' : '#64748b';
                const badgeTxt = isApproved ? '✅ Approved' : isCleared ? '✔ Cleared' : isRejected ? '❌ Rejected' : '⏳ Awaiting Approval';

                return (
                  <Section title={title} icon={icon} accent={accent}>

                    {/* Status badge row */}
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'6px 0 4px' }}>
                      <span style={{ fontSize:'0.72rem', fontWeight:800, padding:'3px 12px', borderRadius:'20px', background:badgeBg, color:badgeCl }}>
                        {badgeTxt}
                      </span>
                      <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>
                        {viewItem.approvedAt
                          ? new Date(viewItem.approvedAt).toLocaleString()
                          : isPending ? 'No decision yet' : '—'}
                      </span>
                    </div>

                    {/* Approved / Rejected by person details */}
                    {!isPending && (
                      <>
                        <Divider label="Decision Made By" />
                        {viewItem.approvedBy ? (
                          <>
                            <Row label="Name"  value={viewItem.approvedBy.name}         />
                            <Row label="Email" value={viewItem.approvedBy.email || '—'} />
                            <Row label="Phone" value={viewItem.approvedBy.phone || '—'} />
                            <Row label="Role"  value={viewItem.approvedBy.role  || '—'} />
                          </>
                        ) : (
                          <Row label="Approved By" value="System / details not captured" />
                        )}
                      </>
                    )}

                    {/* Pending message */}
                    {isPending && (
                      <div style={{ fontSize:'0.78rem', color:'#94a3b8', padding:'4px 0 2px', fontStyle:'italic' }}>
                        This gate pass is pending review. Approval details will appear here once a decision is made.
                      </div>
                    )}

                  </Section>
                );
              })()}

              {/* Rejection Reason */}
              {viewItem.status === "Rejected" && viewItem.rejectionReason && (
                <Section title="Rejection Reason" icon="bi-x-circle" accent="#dc2626">
                  <Row label="Reason" value={viewItem.rejectionReason} />
                </Section>
              )}

            </div>

            {/* Drawer footer */}
            <div style={{ padding:"16px 24px",borderTop:"1px solid #f1f5f9",background:"#f8fafc",display:"flex",gap:"10px",justifyContent:"flex-end" }}>
              <button onClick={() => { setViewItem(null); handleOpenModal("edit", viewItem); }}
                style={{ padding:"8px 18px",borderRadius:"8px",border:"none",background:"#014aad",color:"#fff",fontWeight:700,fontSize:"0.85rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px" }}>
                <i className="bi bi-pencil-square" /> Edit
              </button>
              <button onClick={() => setViewItem(null)}
                style={{ padding:"8px 18px",borderRadius:"8px",border:"1.5px solid #e2e8f0",background:"#fff",fontWeight:700,fontSize:"0.85rem",cursor:"pointer",color:"#64748b" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MaterialsContent />
    </Suspense>
  );
}

// ── Reusable drawer sub-components ────────────────────────────────────────────
function Section({ title, icon, accent = "#1e293b", children }: { title: string; icon: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ background:"#f8fafc", borderRadius:"10px", border:"1px solid #e2e8f0", overflow:"hidden" }}>
      <div style={{ background: accent + "12", borderBottom:"1px solid #e2e8f0", padding:"8px 14px", display:"flex", alignItems:"center", gap:"8px" }}>
        <i className={`bi ${icon}`} style={{ color:accent, fontSize:"0.85rem" }} />
        <span style={{ fontSize:"0.7rem", fontWeight:800, letterSpacing:"0.07em", textTransform:"uppercase", color:accent }}>{title}</span>
      </div>
      <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:"6px" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px", minHeight:"20px" }}>
      <span style={{ fontSize:"0.73rem", color:"#94a3b8", fontWeight:600, flexShrink:0, paddingTop:"1px" }}>{label}</span>
      <span style={{ fontSize:"0.82rem", color: highlight ? "#014aad" : "#1e293b", fontWeight: highlight ? 800 : 600, textAlign:"right", wordBreak:"break-word" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px", margin:"4px 0 2px" }}>
      <div style={{ flex:1, height:"1px", background:"#e2e8f0" }} />
      <span style={{ fontSize:"0.62rem", fontWeight:800, letterSpacing:"0.07em", textTransform:"uppercase", color:"#94a3b8", whiteSpace:"nowrap" }}>
        {label}
      </span>
      <div style={{ flex:1, height:"1px", background:"#e2e8f0" }} />
    </div>
  );
}

