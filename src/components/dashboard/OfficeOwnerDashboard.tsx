"use client";
import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { StatCard, Panel, LineChart, BarChart, QuickActions, StatusPill, DashHeader, AlertItem, DASH_STYLES } from "@/components/dashboard/DashWidgets";

export default function OfficeOwnerDashboard({ user }: { user: any }) {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [helpdesk, setHelpdesk] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    Promise.all([
      api.get("/visitors"),
      api.get("/helpdesk"),
      api.get("/materials"),
      api.get("/bookings"),
      api.get("/auth/me")
    ]).then(([visitorsRes, helpdeskRes, materialsRes, bookingsRes, meRes]) => {
      if (visitorsRes.success) setVisitors(visitorsRes.data || []);
      if (helpdeskRes.success) setHelpdesk(helpdeskRes.data || []);
      if (materialsRes.success) setMaterials(materialsRes.data || []);
      if (bookingsRes.success) setBookings(bookingsRes.data || []);
      if (meRes.success) setProfile(meRes.data || null);
    }).catch(err => {
      console.error("Failed to load dashboard metrics datasets:", err);
    }).finally(()=>setLoading(false));
  },[]);

  if(loading) return <div className="d-flex align-items-center justify-content-center" style={{ height:"50vh" }}><div className="spinner-border" style={{ color:"#014aad" }} /></div>;

  // ── FILTERING DATASETS BY LOGIN AND FLAT (UNIT) NUMBER ───────────────────
  const activeUnits = profile?.assignedUnits || [];
  const assignedUnitsIds = activeUnits.map((u: any) => (u._id || u).toString());
  const userName = user?.name || "";
  const companyName = user?.companyName || "";

  // 1. Filter Visitors
  const filteredVisitors = visitors.filter(v => {
    const vUnitId = (v.unit?._id || v.unit || "").toString();
    const unitMatch = assignedUnitsIds.includes(vUnitId);
    const creatorMatch = v.createdBy === user?._id || (v.personToMeet || "").toLowerCase().includes(userName.toLowerCase());
    return unitMatch || creatorMatch;
  });

  // 2. Filter Helpdesk
  const filteredHelpdesk = helpdesk.filter(c => {
    const nameMatch = (c.tenant?.tenantName || "").toLowerCase().includes(userName.toLowerCase()) ||
                      (c.tenant?.companyName || "").toLowerCase().includes(companyName.toLowerCase()) ||
                      (c.allocatedTo || "").toLowerCase().includes(userName.toLowerCase());
    const creatorMatch = c.createdBy === user?._id || c.tenant?.user === user?._id;
    return nameMatch || creatorMatch;
  });

  // 3. Filter Materials (Gate Passes)
  const filteredMaterials = materials.filter(item => {
    const mUnitId = (item.unit?._id || item.unit || "").toString();
    const unitMatch = assignedUnitsIds.includes(mUnitId);
    const creatorMatch = item.createdBy === user?._id;
    return unitMatch || creatorMatch;
  });

  // 4. Filter Bookings
  const filteredBookings = bookings.filter(b => {
    const nameMatch = (b.bookedBy || "").toLowerCase().includes(userName.toLowerCase());
    const particularsMatch = (b.bookingParticulars || "").toLowerCase().includes(companyName.toLowerCase());
    return nameMatch || particularsMatch;
  });

  // ── DYNAMIC METRICS CALCULATIONS ─────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  const visitorsToday = filteredVisitors.filter(v => v.visitDate === todayStr).length;
  const visitorsCheckedIn = filteredVisitors.filter(v => v.status === "Checked-In").length;
  const visitorsPending = filteredVisitors.filter(v => v.status === "Pending").length;

  const gatePassTotal = filteredMaterials.length;
  const gatePassPending = filteredMaterials.filter(m => m.status === "Pending").length;
  const gatePassApproved = filteredMaterials.filter(m => m.status === "Approved").length;

  // Group visitors by last 7 days dynamically
  const last7DaysTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = filteredVisitors.filter(v => v.visitDate === dateStr).length;
    return { label: dayLabel, value: count };
  });

  const C = { purple:"#7c3aed",blue:"#014aad",green:"#16a34a",yellow:"#d97706",red:"#dc2626",teal:"#0891b2" };

  return (
    <div style={{ paddingBottom:40 }}>
      <style>{DASH_STYLES}</style>

      <DashHeader
        title="Office Owner Dashboard"
        subtitle={`Office access management · ${new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}`}
        user={user} accentColor="#014aad" gradientFrom="#1e293b" gradientTo="#0f172a"
      >
        {activeUnits.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
            {activeUnits.map((u: any, idx: number) => (
              <div key={idx} style={{ 
                background: "rgba(255,255,255,0.06)", 
                border: "1px solid rgba(255,255,255,0.12)", 
                borderRadius: "12px", 
                padding: "8px 14px", 
                display: "flex", 
                alignItems: "center", 
                gap: "12px",
                color: "#f8fafc"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="bi bi-building" style={{ fontSize: "0.85rem", color: "#38bdf8" }}></i>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700 }}>{u.property?.propertyName || "Office Location"}</span>
                </div>
                <span style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="bi bi-layers" style={{ fontSize: "0.85rem", color: "#fbbf24" }}></i>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600 }}>{u.floor?.floorName || `Floor ${u.floorNumber}`}</span>
                </div>
                <span style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="bi bi-door-open" style={{ fontSize: "0.85rem", color: "#34d399" }}></i>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700 }}>Unit {u.unitNumber}</span>
                </div>
                <span style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="bi bi-bounding-box" style={{ fontSize: "0.85rem", color: "#60a5fa" }}></i>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#60a5fa" }}>{u.sqft?.toLocaleString() || 0} sqft</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashHeader>

      {/* Stats Row - Calculating all stats dynamically from the filtered flat/unit context */}
      <div className="d-g4 d-mb">
        <StatCard 
          label="Visitors Today" 
          value={visitorsToday} 
          icon="bi-person-badge" 
          color={C.purple} 
          sub={`${visitorsCheckedIn} currently inside`} 
        />
        <StatCard 
          label="Helpdesk Requests" 
          value={filteredHelpdesk.length} 
          icon="bi-headset" 
          color={C.yellow} 
          sub="Maintenance & support tickets" 
        />
        <StatCard 
          label="Materials Entry" 
          value={gatePassTotal} 
          icon="bi-box-seam" 
          color={C.blue} 
          sub={`${gatePassPending} pending clearance`} 
        />
        <StatCard 
          label="Active Bookings" 
          value={filteredBookings.length} 
          icon="bi-calendar-event" 
          color={C.teal} 
          sub="Workspace & amenities booked" 
        />
      </div>

      {/* Quick Actions */}
      <div className="d-mb">
        <Panel title="Quick Actions" icon="bi-lightning-fill" iconColor="#fbbf24" accent="#014aad">
          <QuickActions actions={[
            { label:"Register Visitor",       icon:"bi-person-plus-fill",   href:"/admin/visitors",  color:C.purple },
            { label:"Create Gate Pass",       icon:"bi-card-checklist",     href:"/admin/materials", color:C.blue },
            { label:"Add Employees",          icon:"bi-people-fill",        href:"/admin/users",     color:C.green },
            { label:"Maintenance Request",    icon:"bi-tools",              href:"/admin/helpdesk",  color:C.yellow },
            { label:"Lease Documents",        icon:"bi-file-earmark-text",  href:"/admin/leases",    color:C.teal },
          ]} />
        </Panel>
      </div>

      {/* Charts Row */}
      <div className="d-g3 d-mb">

        {/* Visitor Analytics */}
        <Panel title="Visitor Analytics" icon="bi-graph-up-arrow" iconColor="#7c3aed" accent="#014aad">
          {filteredVisitors.length>0
            ? <LineChart items={last7DaysTrend} color={C.purple} />
            : <p style={{ textAlign:"center",color:"#94a3b8",margin:"30px 0",fontSize:"0.8rem" }}>No visitor data</p>}
          <div style={{ display:"flex",gap:14,marginTop:12 }}>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Today</div><div style={{ fontSize:"0.9rem",fontWeight:800 }}>{visitorsToday}</div></div>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Pending</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:C.yellow }}>{visitorsPending}</div></div>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Inside</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:C.green }}>{visitorsCheckedIn}</div></div>
          </div>
        </Panel>

        {/* Gate Pass Summary */}
        <Panel title="Gate Pass Analytics" icon="bi-bar-chart-fill" iconColor="#38bdf8" accent="#014aad">
          <BarChart items={[
            { label:"Total",   value:gatePassTotal },
            { label:"Pending", value:gatePassPending },
            { label:"Approved",value:gatePassApproved },
          ]} color={C.blue} />
          <div style={{ display:"flex",gap:14,marginTop:12 }}>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Total</div><div style={{ fontSize:"0.9rem",fontWeight:800 }}>{gatePassTotal}</div></div>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Approved</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:C.green }}>{gatePassApproved}</div></div>
          </div>
        </Panel>

        {/* Operational Overview summary */}
        <Panel title="Operations Overview" icon="bi-shield-check" iconColor="#16a34a" accent="#014aad">
          <div style={{ display:"flex",flexDirection:"column",gap:14,padding:"10px 0" }}>
            <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded border">
              <div>
                <span className="fw-bold text-dark d-block small">Visitors Pending</span>
                <span className="text-muted" style={{ fontSize:"0.7rem" }}>Awaiting owner action</span>
              </div>
              <span className="badge bg-purple bg-opacity-10 text-purple border border-purple rounded-pill px-3 py-1 fw-bold">{visitorsPending}</span>
            </div>

            <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded border">
              <div>
                <span className="fw-bold text-dark d-block small">Pending Dues Clearance</span>
                <span className="text-muted" style={{ fontSize:"0.7rem" }}>Outstanding gate passes</span>
              </div>
              <span className="badge bg-warning bg-opacity-10 text-warning border border-warning rounded-pill px-3 py-1 fw-bold">{gatePassPending}</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Bottom Row */}
      <div className="d-g2">
        {/* Recent Visitors */}
        <Panel title="Recent Visitors" icon="bi-person-badge" iconColor="#7c3aed" link="/admin/visitors" accent="#014aad">
          {filteredVisitors.length>0
            ? filteredVisitors.slice(0,5).map((v:any,i:number)=>(
              <AlertItem key={i} icon="bi-person-check" iconColor={C.purple}
                title={v.visitorName} sub={`${v.property?.propertyName || v.placeOfVisit || "Office"} · ${v.visitDate}`} time={<StatusPill status={v.status} />} />
            ))
            : <p style={{ textAlign:"center",color:"#94a3b8",fontSize:"0.8rem",margin:"20px 0" }}>No recent visitors</p>}
        </Panel>

        {/* Recent Gate Passes */}
        <Panel title="Recent Gate Passes" icon="bi-card-checklist" iconColor="#38bdf8" link="/admin/materials" accent="#014aad">
          {filteredMaterials.length>0
            ? filteredMaterials.slice(0,5).map((g:any,i:number)=>(
              <AlertItem key={i} icon="bi-box-seam" iconColor={C.blue}
                title={g.materialDetails||"—"} sub={`${g.property?.propertyName || g.building || "Office"} · ${g.gatePassType}`} time={<StatusPill status={g.status} />} />
            ))
            : <p style={{ textAlign:"center",color:"#94a3b8",fontSize:"0.8rem",margin:"20px 0" }}>No gate passes</p>}
        </Panel>
      </div>
    </div>
  );
}
