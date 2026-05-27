"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import VisitorModal from "@/components/dashboard/VisitorModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

export default function VisitorsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);

  const [visitors, setVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, todayCount: 0, checkedIn: 0, pending: 0, approved: 0, checkedOut: 0, rejected: 0 });
  const [viewItem, setViewItem] = useState<any>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchVisitors();
    fetchStats();
    api.get("/auth/me").then(res => {
      if (res.success) {
        setCurrentUser(res.data);
      } else {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              setCurrentUser(JSON.parse(stored));
            } catch {}
          }
        }
      }
    }).catch(() => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user");
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch {}
        }
      }
    });
  }, []);

  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/visitors");
      if (response.success) setVisitors(response.data);
    } catch (err) {
      console.error("Failed to fetch visitors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/visitors/stats");
      if (response.success) setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch visitor stats:", err);
    }
  };

  const filteredVisitors = visitors.filter(v => {
    const isOwner = currentUser?.role === "Owner" || currentUser?.role === "Office Owner";
    if (isOwner) {
      const ownerUnitIds = (currentUser.assignedUnits || []).map((u: any) => (u._id || u).toString());
      const visitorUnitId = (v.unit?._id || v.unit || "").toString();
      const unitMatch = ownerUnitIds.includes(visitorUnitId);
      
      const creatorId = (v.createdBy?._id || v.createdBy || "").toString();
      const currentUserId = (currentUser._id || "").toString();
      const creatorMatch = creatorId === currentUserId || (v.personToMeet || "").toLowerCase().includes((currentUser.name || "").toLowerCase());
      
      if (!unitMatch && !creatorMatch) return false;
    }
    return (
      (v.visitorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.purposeOfVisit || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.visitorContactNumber || "").includes(searchTerm)
    );
  });

  const handleOpenModal = (mode: ModalMode, visitor: any = null) => {
    if (mode === "view") { setViewItem(visitor); return; }
    setModalMode(mode);
    setSelectedVisitor(visitor);
    setIsModalOpen(true);
  };

  const handleSaveVisitor = async (savedData: any) => {
    try {
      const response =
        modalMode === "edit"
          ? await api.put(`/visitors/${savedData._id}`, savedData)
          : await api.post("/visitors", savedData);
      if (response.success) fetchVisitors();
    } catch (err) {
      console.error("Failed to save visitor:", err);
    }
    setIsModalOpen(false);
  };

  const handleCheckOut = async (id: string) => {
    if (confirm("Check out this visitor?")) {
      try {
        const response = await api.patch(`/visitors/${id}/check-out`, {});
        if (response.success) { fetchVisitors(); fetchStats(); }
      } catch (err) {
        console.error("Failed to check out visitor:", err);
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await api.patch(`/visitors/${id}/approve`, {});
      if (response.success) { fetchVisitors(); fetchStats(); }
    } catch (err) {
      console.error("Failed to approve visitor:", err);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      const response = await api.patch(`/visitors/${id}/reject`, { reason });
      if (response.success) { fetchVisitors(); fetchStats(); }
    } catch (err) {
      console.error("Failed to reject visitor:", err);
    }
  };

  // ── Shared thead cell style ────────────────────────────────────────────────
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

  return (
    <div className="container-fluid p-0">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: "-0.02em", fontSize: "1.5rem" }}>
            Visitor Management
          </h2>
          <p className="text-muted small mb-0">Track and manage all visitors entering the premises</p>
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
            <i className="bi bi-plus-circle" /> Add New Visitor
          </button>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Visitors",   sub: "All Time",        value: stats.total,      icon: "bi-people",           color: "#014aad" },
          { label: "Today's Visitors", sub: "Today",           value: stats.todayCount, icon: "bi-calendar-check",   color: "#16a34a" },
          { label: "Pending Approval", sub: "Awaiting Review", value: stats.pending,    icon: "bi-hourglass-split",  color: "#eab308" },
          { label: "Approved",         sub: "Access Granted",  value: stats.approved,   icon: "bi-check-circle",     color: "#16a34a" },
          { label: "Checked In",       sub: "In Building",     value: stats.checkedIn,  icon: "bi-door-open",        color: "#014aad" },
          { label: "Checked Out",      sub: "Today",           value: stats.checkedOut, icon: "bi-box-arrow-right",  color: "#6b7280" },
        ].map(({ label, sub, value, icon, color }) => (
          <div className="col-md-2" key={label}>
            <div
              className="bg-white p-3 rounded-4 border shadow-sm d-flex align-items-center gap-3 h-100"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: "42px", height: "42px", backgroundColor: `${color}18`, color }}
              >
                <i className={`bi ${icon}`} style={{ fontSize: "1.1rem" }} />
              </div>
              <div>
                <div className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.05em" }}>{label}</div>
                <h4 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.02em" }}>{value}</h4>
                <div className="text-muted" style={{ fontSize: "0.68rem" }}>{sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-3 shadow-sm border px-3 py-2 mb-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
        {/* Search */}
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "320px" }}>
          <i className="bi bi-search text-muted" />
          <input
            type="text"
            className="border-0 bg-transparent w-100 shadow-none small"
            placeholder="Search by visitor name, contact no, purpose..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ outline: "none", fontSize: "0.85rem" }}
          />
        </div>

        {/* Filters */}
        <div className="d-flex gap-2">
          <div className="d-flex align-items-center border rounded-pill px-3 py-1 bg-light">
            <i className="bi bi-calendar3 text-muted me-2 small" />
            <select
              className="form-select border-0 bg-transparent shadow-none text-muted fw-medium py-0 px-0 pe-3"
              style={{ fontSize: "0.75rem", width: "110px" }}
            >
              <option>Select Date</option>
              <option>Today</option>
              <option>Yesterday</option>
            </select>
          </div>
          <select
            className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium"
            style={{ fontSize: "0.75rem", minWidth: "130px" }}
          >
            <option>Purpose: All</option>
            <option>Meeting</option>
            <option>Delivery</option>
            <option>Interview</option>
          </select>
          <select
            className="form-select form-select-sm border rounded-pill px-3 shadow-none bg-light text-muted fw-medium"
            style={{ fontSize: "0.75rem", minWidth: "130px" }}
          >
            <option>Visit Status: All</option>
            <option>Inside</option>
            <option>Checked Out</option>
          </select>
          <button
            className="btn btn-light btn-sm border rounded-pill px-3 shadow-none fw-bold text-muted d-flex align-items-center gap-2"
            style={{ fontSize: "0.75rem" }}
          >
            <i className="bi bi-arrow-clockwise" /> Reset
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0 align-middle" style={{ width: "100%", borderCollapse: "collapse" }}>

            <thead>
              <tr>
                <th style={thStyle}>Visitor Name</th>
                <th style={thStyle}>Contact No</th>
                <th style={thStyle}>Property / Flat</th>
                <th style={thStyle}>Person to Meet</th>


                <th style={thStyle}>In Time</th>
                <th style={thStyle}>Out Time</th>
                <th style={thStyle}>Created By</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Loading visitors...
                  </td>
                </tr>
              ) : filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted" style={{ fontSize: "0.9rem" }}>
                    <i className="bi bi-inbox me-2" />No visitors found.
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((visitor, index) => (
                  <tr
                    key={visitor._id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: "0.85rem",
                    }}
                  >
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>
                      {visitor.visitorName}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b", fontFamily: "monospace" }}>
                      {visitor.visitorContactNumber}
                    </td>

                    {/* Property / Flat */}
                    <td style={{ padding: "10px 14px", minWidth: "180px" }}>
                      {/* Property Name */}
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                        {visitor.property?.propertyName || visitor.placeOfVisit || "—"}
                      </div>
                      {/* Floor */}
                      {visitor.floor && (
                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                          <i className="bi bi-layers me-1" style={{ color: "#014aad" }} />
                          Floor {visitor.floor?.floorNumber || "—"}
                          {visitor.floor?.floorName ? ` (${visitor.floor.floorName})` : ""}
                        </div>
                      )}
                      {/* Unit / Office */}
                      {visitor.unit && (
                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "1px" }}>
                          <i className="bi bi-door-open me-1" style={{ color: "#16a34a" }} />
                          Unit {visitor.unit?.unitNumber || "—"}
                          {visitor.unit?.unitType ? (
                            <span
                              className="ms-1 badge rounded-pill"
                              style={{ fontSize: "0.62rem", backgroundColor: "#f1f5f9", color: "#475569", padding: "1px 6px" }}
                            >
                              {visitor.unit.unitType}
                            </span>
                          ) : null}
                        </div>
                      )}
                      {/* Owner Name on unit */}
                      {visitor.unit?.ownerName && (
                        <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "1px" }}>
                          <i className="bi bi-person me-1" />
                          {visitor.unit.ownerName}
                        </div>
                      )}
                    </td>

                    {/* Person to Meet */}
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>
                      {visitor.personToMeet || "—"}
                    </td>



                    <td style={{ padding: "10px 14px", color: "#64748b" }}>
                      {visitor.inTime || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>
                      {visitor.outTime || "—"}
                    </td>

                    {/* Created By */}
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>
                        {visitor.createdBy?.name || "Admin"}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                        {visitor.createdBy?.email || "—"}
                      </div>
                    </td>

                    <td style={{ padding: "10px 14px" }}>
                      {(() => {
                        const s = visitor.status;
                        const cfg: Record<string, { bg: string; color: string; label: string }> = {
                          Pending:       { bg: "#fef9c3", color: "#854d0e", label: "⏳ Pending"     },
                          Approved:      { bg: "#dcfce7", color: "#166534", label: "✅ Approved"    },
                          Rejected:      { bg: "#fee2e2", color: "#991b1b", label: "❌ Rejected"    },
                          "Checked-In":  { bg: "#dbeafe", color: "#1e40af", label: "🟢 Checked In"  },
                          "Checked-Out": { bg: "#f1f5f9", color: "#475569", label: "Checked Out"   },
                        };
                        const { bg, color, label } = cfg[s] || cfg["Pending"];
                        return (
                          <span
                            className="badge rounded-pill fw-bold px-2 py-1"
                            style={{ backgroundColor: bg, color, fontSize: "0.7rem" }}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div className="d-flex gap-2 justify-content-center align-items-center">
                        <button
                          className="btn btn-link p-0"
                          title="View Details"
                          onClick={() => handleOpenModal("view", visitor)}
                        >
                          <i className="bi bi-eye-fill" style={{ fontSize: "1.05rem", color: "#4b5563" }} />
                        </button>
                        <button
                          className="btn btn-link p-0"
                          title="Edit"
                          onClick={() => handleOpenModal("edit", visitor)}
                        >
                          <i className="bi bi-pencil-square" style={{ fontSize: "1.05rem", color: "#014aad" }} />
                        </button>
                        {visitor.status === "Pending" && (
                          <>
                            <button
                              className="btn btn-link p-0"
                              title="Approve"
                              onClick={() => handleApprove(visitor._id)}
                            >
                              <i className="bi bi-check-circle-fill" style={{ fontSize: "1.05rem", color: "#16a34a" }} />
                            </button>
                            <button
                              className="btn btn-link p-0"
                              title="Reject"
                              onClick={() => handleReject(visitor._id)}
                            >
                              <i className="bi bi-x-circle-fill" style={{ fontSize: "1.05rem", color: "#dc2626" }} />
                            </button>
                          </>
                        )}
                        {visitor.status === "Checked-In" && (
                          <button
                            className="btn btn-link p-0"
                            title="Check Out"
                            onClick={() => handleCheckOut(visitor._id)}
                          >
                            <i className="bi bi-box-arrow-right" style={{ fontSize: "1.05rem", color: "#dc2626" }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                ))
              )}
            </tbody>

          </table>
        </div>

        {/* ── Pagination Footer ───────────────────────────────────────────── */}
        <div className="px-4 py-3 border-top d-flex justify-content-between align-items-center bg-white">
          <span className="text-muted small">
            Showing 1–{filteredVisitors.length} of {visitors.length} entries
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

      {/* ── Visitor Modal ─────────────────────────────────────────────────── */}
      <VisitorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVisitor}
        editData={selectedVisitor}
        mode={modalMode}
      />

      {/* ── View Detail Drawer ────────────────────────────────────────────── */}
      {viewItem && (
        <div style={{
          position:"fixed",top:0,left:0,right:0,bottom:0,
          backgroundColor:"rgba(15,23,42,0.65)",zIndex:9999,
          display:"flex",justifyContent:"flex-end",
          backdropFilter:"blur(5px)",animation:"vFadeIn 0.2s ease",
        }} onClick={() => setViewItem(null)}>
          <style>{`
            @keyframes vFadeIn  { from{opacity:0} to{opacity:1} }
            @keyframes vSlideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
          `}</style>

          <div style={{
            width:"540px",height:"100%",background:"#fff",overflowY:"auto",
            boxShadow:"-24px 0 60px rgba(0,0,0,0.22)",animation:"vSlideIn 0.3s cubic-bezier(0.4,0,0.2,1)",
          }} onClick={e => e.stopPropagation()}>

            {/* ── Drawer Header ──────────────────────────────────────────── */}
            <div style={{ background:"#1e293b", padding:"20px 24px", position:"sticky", top:0, zIndex:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:"0.62rem", fontWeight:800, letterSpacing:"0.09em", color:"#60a5fa", textTransform:"uppercase" }}>Visitor Detail</div>
                  <h5 style={{ color:"#fff", margin:"4px 0 2px", fontWeight:700, fontSize:"1.05rem" }}>{viewItem.visitorName}</h5>
                  <div style={{ color:"#94a3b8", fontSize:"0.78rem" }}>
                    <i className="bi bi-telephone me-1" />{viewItem.visitorContactNumber}
                  </div>
                </div>
                <button onClick={() => setViewItem(null)}
                  style={{ background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"8px",color:"#fff",width:"32px",height:"32px",cursor:"pointer",fontSize:"1.2rem",flexShrink:0 }}>×</button>
              </div>
              {/* Badges row */}
              <div style={{ display:"flex", gap:"8px", marginTop:"12px", flexWrap:"wrap" }}>
                {/* Status badge */}
                {(() => {
                  const cfg: Record<string,{bg:string;cl:string}> = {
                    Pending:{bg:"#fef9c3",cl:"#854d0e"},Approved:{bg:"#dcfce7",cl:"#166534"},
                    Rejected:{bg:"#fee2e2",cl:"#991b1b"},"Checked-In":{bg:"#dbeafe",cl:"#1e40af"},"Checked-Out":{bg:"#f1f5f9",cl:"#475569"}
                  };
                  const s = cfg[viewItem.status] || cfg.Pending;
                  return <span style={{ fontSize:"0.7rem",fontWeight:800,padding:"3px 10px",borderRadius:"20px",background:s.bg,color:s.cl }}>{viewItem.status||"Pending"}</span>;
                })()}
                {/* Purpose badge */}
                {viewItem.purposeOfVisit && (
                  <span style={{ fontSize:"0.7rem",fontWeight:700,padding:"3px 10px",borderRadius:"20px",background:"rgba(255,255,255,0.12)",color:"#e2e8f0" }}>
                    <i className="bi bi-tag me-1" />{viewItem.purposeOfVisit}
                  </span>
                )}
                {/* Approval level badge */}
                {viewItem.approvalLevel && (
                  <span style={{ fontSize:"0.7rem",fontWeight:700,padding:"3px 10px",borderRadius:"20px",
                    background: viewItem.approvalLevel==="Office Level"?"#f3e8ff":viewItem.approvalLevel==="Floor Level"?"#dcfce7":"#dbeafe",
                    color:      viewItem.approvalLevel==="Office Level"?"#7e22ce":viewItem.approvalLevel==="Floor Level"?"#166534":"#1d4ed8"
                  }}>{viewItem.approvalLevel}</span>
                )}
              </div>
            </div>

            <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:"14px" }}>

              {/* Visitor Info */}
              <VSection title="Visitor Information" icon="bi-person-badge">
                <VRow label="Full Name"      value={viewItem.visitorName} />
                <VRow label="Contact No"     value={viewItem.visitorContactNumber} />
                <VRow label="Address"        value={viewItem.address || "—"} />
                <VRow label="ID Proof Type"  value={viewItem.idProofType || "—"} />
                <VRow label="ID Number"      value={viewItem.idNumber || "—"} />
                <VRow label="Vehicle No"     value={viewItem.vehicleNumber || "—"} />
              </VSection>

              {/* Location */}
              {(viewItem.property || viewItem.floor || viewItem.unit) && (
                <VSection title="Visiting Location" icon="bi-building" accent="#1d4ed8">
                  {viewItem.property && (
                    <>
                      <VRow label="Property" value={viewItem.property?.propertyName} />
                      <VRow label="Address"  value={viewItem.property?.propertyAddress || "—"} />
                      <VRow label="Type"     value={viewItem.property?.propertyType    || "—"} />
                    </>
                  )}
                  {viewItem.floor && (
                    <>
                      <VDivider label="Floor" />
                      <VRow label="Floor No"   value={`Floor ${viewItem.floor?.floorNumber}`} />
                      <VRow label="Floor Name" value={viewItem.floor?.floorName || "—"} />
                    </>
                  )}
                  {viewItem.unit && (
                    <>
                      <VDivider label="Office / Unit" />
                      <VRow label="Unit No"    value={viewItem.unit?.unitNumber} />
                      <VRow label="Unit Type"  value={viewItem.unit?.unitType    || "—"} />
                      <VRow label="Owner Name" value={viewItem.unit?.ownerName   || "—"} />
                    </>
                  )}
                </VSection>
              )}

              {/* Visit Details */}
              <VSection title="Visit Details" icon="bi-calendar-check" accent="#059669">
                <VRow label="Person to Meet"  value={viewItem.personToMeet  || "—"} />
                <VRow label="Purpose"         value={viewItem.purposeOfVisit || "—"} />
                <VRow label="Visit Date"      value={viewItem.visitDate      || "—"} />
                <VRow label="In Time"         value={viewItem.inTime         || "—"} />
                <VRow label="Out Time"        value={(viewItem.outTime && viewItem.outTime !== "-") ? viewItem.outTime : "—"} />
              </VSection>

              {/* Approval Decision — always shown */}
              <VSection
                title={viewItem.status==="Rejected" ? "Rejected By" : "Approval Decision"}
                icon={viewItem.status==="Rejected" ? "bi-x-octagon" : viewItem.status==="Pending" ? "bi-hourglass-split" : "bi-patch-check-fill"}
                accent={viewItem.status==="Rejected" ? "#dc2626" : viewItem.status==="Approved"||viewItem.status==="Checked-In"||viewItem.status==="Checked-Out" ? "#059669" : "#94a3b8"}
              >
                {/* Decision badge + time */}
                <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"5px 0 4px" }}>
                  {(() => {
                    const cfg: Record<string,{bg:string;cl:string;txt:string}> = {
                      Pending:{bg:"#f1f5f9",cl:"#64748b",txt:"⏳ Awaiting Approval"},
                      Approved:{bg:"#dcfce7",cl:"#166534",txt:"✅ Approved"},
                      Rejected:{bg:"#fee2e2",cl:"#991b1b",txt:"❌ Rejected"},
                      "Checked-In":{bg:"#dbeafe",cl:"#1e40af",txt:"🟢 Checked In"},
                      "Checked-Out":{bg:"#f1f5f9",cl:"#475569",txt:"🚪 Checked Out"},
                    };
                    const s = cfg[viewItem.status]||cfg.Pending;
                    return <span style={{ fontSize:"0.72rem",fontWeight:800,padding:"3px 12px",borderRadius:"20px",background:s.bg,color:s.cl }}>{s.txt}</span>;
                  })()}
                  <span style={{ fontSize:"0.72rem",color:"#94a3b8" }}>
                    {viewItem.approvedAt ? new Date(viewItem.approvedAt).toLocaleString() : (viewItem.status==="Pending" ? "No decision yet" : "—")}
                  </span>
                </div>

                {viewItem.status !== "Pending" && (
                  <>
                    <VDivider label="Decision Made By" />
                    {viewItem.approvedBy ? (
                      <>
                        <VRow label="Name"  value={viewItem.approvedBy.name} />
                        <VRow label="Email" value={viewItem.approvedBy.email || "—"} />
                        <VRow label="Phone" value={viewItem.approvedBy.phone || "—"} />
                        <VRow label="Role"  value={viewItem.approvedBy.role  || "—"} />
                      </>
                    ) : (
                      <VRow label="Approved By" value="System / auto-approved" />
                    )}
                  </>
                )}

                {viewItem.status === "Pending" && (
                  <div style={{ fontSize:"0.78rem",color:"#94a3b8",fontStyle:"italic",paddingTop:"4px" }}>
                    This visitor is awaiting approval. Details will appear once a decision is made.
                  </div>
                )}

                {viewItem.status === "Rejected" && viewItem.rejectionReason && (
                  <>
                    <VDivider label="Rejection Reason" />
                    <VRow label="Reason" value={viewItem.rejectionReason} />
                  </>
                )}
              </VSection>

              {/* Created By */}
              <VSection title="Created By" icon="bi-person-plus" accent="#0284c7">
                {viewItem.createdBy ? (
                  <>
                    <VRow label="Name"       value={viewItem.createdBy.name} />
                    <VRow label="Email"      value={viewItem.createdBy.email || "—"} />
                    <VRow label="Phone"      value={viewItem.createdBy.phone || "—"} />
                    <VRow label="Role"       value={viewItem.createdBy.role  || "—"} />
                  </>
                ) : <VRow label="Created By" value="—" />}
                <VRow label="Registered At" value={viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString() : "—"} />
              </VSection>

            </div>

            {/* Drawer footer */}
            <div style={{ padding:"16px 24px", borderTop:"1px solid #f1f5f9", background:"#f8fafc", display:"flex", gap:"10px", justifyContent:"flex-end", position:"sticky", bottom:0 }}>
              <button onClick={() => { setViewItem(null); handleOpenModal("edit", viewItem); }}
                style={{ padding:"8px 18px",borderRadius:"8px",border:"none",background:"#014aad",color:"#fff",fontWeight:700,fontSize:"0.85rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px" }}>
                <i className="bi bi-pencil-square" /> Edit
              </button>
              {viewItem.status === "Pending" && (
                <>
                  <button onClick={() => { handleApprove(viewItem._id); setViewItem(null); }}
                    style={{ padding:"8px 18px",borderRadius:"8px",border:"none",background:"#16a34a",color:"#fff",fontWeight:700,fontSize:"0.85rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px" }}>
                    <i className="bi bi-check-circle-fill" /> Approve
                  </button>
                  <button onClick={() => { const r=prompt("Rejection reason:"); if(r!==null){handleReject(viewItem._id); setViewItem(null);} }}
                    style={{ padding:"8px 18px",borderRadius:"8px",border:"none",background:"#dc2626",color:"#fff",fontWeight:700,fontSize:"0.85rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px" }}>
                    <i className="bi bi-x-circle-fill" /> Reject
                  </button>
                </>
              )}
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

// ── Drawer helpers ────────────────────────────────────────────────────────────
function VSection({ title, icon, accent="#1e293b", children }: { title:string; icon:string; accent?:string; children:React.ReactNode }) {
  return (
    <div style={{ background:"#f8fafc", borderRadius:"10px", border:"1px solid #e2e8f0", overflow:"hidden" }}>
      <div style={{ background:accent+"12", borderBottom:"1px solid #e2e8f0", padding:"8px 14px", display:"flex", alignItems:"center", gap:"8px" }}>
        <i className={`bi ${icon}`} style={{ color:accent, fontSize:"0.85rem" }} />
        <span style={{ fontSize:"0.68rem", fontWeight:800, letterSpacing:"0.07em", textTransform:"uppercase", color:accent }}>{title}</span>
      </div>
      <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:"6px" }}>{children}</div>
    </div>
  );
}

function VRow({ label, value, highlight=false }: { label:string; value:any; highlight?:boolean }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"14px", minHeight:"20px" }}>
      <span style={{ fontSize:"0.72rem", color:"#94a3b8", fontWeight:600, flexShrink:0, paddingTop:"1px" }}>{label}</span>
      <span style={{ fontSize:"0.82rem", color:highlight?"#014aad":"#1e293b", fontWeight:highlight?800:600, textAlign:"right", wordBreak:"break-word" }}>{value??"—"}</span>
    </div>
  );
}

function VDivider({ label }: { label:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px", margin:"3px 0 2px" }}>
      <div style={{ flex:1, height:"1px", background:"#e2e8f0" }} />
      <span style={{ fontSize:"0.6rem", fontWeight:800, letterSpacing:"0.07em", textTransform:"uppercase", color:"#94a3b8", whiteSpace:"nowrap" }}>{label}</span>
      <div style={{ flex:1, height:"1px", background:"#e2e8f0" }} />
    </div>
  );
}
