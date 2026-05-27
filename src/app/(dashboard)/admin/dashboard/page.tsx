"use client";
import { useState, useEffect, Suspense, lazy } from "react";
import Link from "next/link";
import { api } from "@/utils/api";

// ── Lazy-loaded role dashboards ───────────────────────────────────────────────
const FloorAdminDash  = lazy(()=>import("@/components/dashboard/FloorAdminDashboard"));
const OfficeOwnerDash = lazy(()=>import("@/components/dashboard/OfficeOwnerDashboard"));
const StaffAdminDash  = lazy(()=>import("@/components/dashboard/StaffAdminDashboard"));
const WatchmanDash    = lazy(()=>import("@/components/dashboard/WatchmanDashboard"));

const COLOR = { blue:"#014aad",green:"#16a34a",yellow:"#d97706",red:"#dc2626",purple:"#7c3aed",slate:"#475569",teal:"#0891b2",orange:"#ea580c" };

const SPINNER = (
  <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"50vh",flexDirection:"column",gap:16 }}>
    <div className="spinner-border" style={{ color:"#014aad",width:36,height:36 }} role="status" />
    <span style={{ color:"#64748b",fontSize:"0.9rem",fontWeight:600 }}>Loading dashboard...</span>
  </div>
);

function StatCard({ label, value, icon, color, sub }: any) {
  return (
    <div style={{ background:"#fff", borderRadius:"12px", border:"1px solid #e2e8f0", padding:"16px 18px", display:"flex", alignItems:"center", gap:"14px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ width:44,height:44,borderRadius:"10px",background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <i className={`bi ${icon}`} style={{ color, fontSize:"1.2rem" }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:"0.65rem",fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em" }}>{label}</div>
        <div style={{ fontSize:"1.35rem",fontWeight:800,color:"#1e293b",lineHeight:1.2 }}>{value}</div>
        {sub && <div style={{ fontSize:"0.68rem",color:"#94a3b8",marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function MiniBar({ label, val, max, color }: any) {
  const pct = max > 0 ? Math.min(100, Math.round((val/max)*100)) : 0;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.75rem",fontWeight:600,color:"#475569",marginBottom:3 }}>
        <span>{label}</span><span>{pct}%</span>
      </div>
      <div style={{ background:"#f1f5f9",borderRadius:6,height:7 }}>
        <div style={{ width:`${pct}%`,height:"100%",borderRadius:6,background:color,transition:"width 0.6s ease" }} />
      </div>
    </div>
  );
}

function RevenueBar({ items }: { items: { label:string; revenue:number }[] }) {
  const max = Math.max(...items.map(i=>i.revenue),1);
  return (
    <div style={{ display:"flex",alignItems:"flex-end",gap:6,height:120,paddingTop:8 }}>
      {items.map((item,i)=>(
        <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
          <div style={{ fontSize:"0.6rem",color:"#94a3b8",fontWeight:700 }}>
            {item.revenue>0 ? `₹${(item.revenue/1000).toFixed(0)}K` : "—"}
          </div>
          <div style={{ width:"100%",background: i===items.length-1?"#014aad":"#bfdbfe",borderRadius:"4px 4px 0 0",
            height:`${Math.max(6,(item.revenue/max)*100)}px`,transition:"height 0.5s ease" }} />
          <div style={{ fontSize:"0.6rem",color:"#64748b",fontWeight:600,whiteSpace:"nowrap" }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function VisitorLine({ items }: { items: { label:string; count:number }[] }) {
  const max = Math.max(...items.map(i=>i.count),1);
  const w=280,h=80,pad=10;
  const pts = items.map((item,i)=>{
    const x = pad + (i/(items.length-1||1))*(w-2*pad);
    const y = pad + (1 - item.count/max)*(h-2*pad);
    return `${x},${y}`;
  }).join(" ");
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible" }}>
        <polyline fill="none" stroke="#014aad" strokeWidth="2.5" strokeLinejoin="round" points={pts} />
        {items.map((item,i)=>{
          const x=pad+(i/(items.length-1||1))*(w-2*pad);
          const y=pad+(1-item.count/max)*(h-2*pad);
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#014aad" />;
        })}
      </svg>
      <div style={{ display:"flex",justifyContent:"space-between",marginTop:4 }}>
        {items.map((item,i)=>(
          <div key={i} style={{ fontSize:"0.58rem",color:"#94a3b8",fontWeight:600,textAlign:"center",flex:1 }}>{item.label}</div>
        ))}
      </div>
    </div>
  );
}

const STATUS_PILL: Record<string,{bg:string;cl:string}> = {
  Pending:{bg:"#fef9c3",cl:"#854d0e"},Approved:{bg:"#dcfce7",cl:"#166534"},
  Rejected:{bg:"#fee2e2",cl:"#991b1b"},"Checked-In":{bg:"#dbeafe",cl:"#1e40af"},
  "Checked-Out":{bg:"#f1f5f9",cl:"#475569"},Cleared:{bg:"#dbeafe",cl:"#1e40af"},
};

export default function DashboardPage() {
  const [m, setM]    = useState<any>({});
  const [rev, setRev]= useState<any[]>([]);
  const [vis, setVis]= useState<any[]>([]);
  const [props, setProps] = useState<any[]>([]);
  const [recentV, setRecentV] = useState<any[]>([]);
  const [recentG, setRecentG] = useState<any[]>([]);
  const [expLeases, setExpLeases] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    try { setUser(JSON.parse(localStorage.getItem("user")||"{}")); } catch {}
    api.get("/dashboard/metrics").then(r=>{
      if(r.success){
        setM(r.data.metrics||{});
        setRev(r.data.monthlyRevenue||[]);
        setVis(r.data.visitorTrend||[]);
        setProps(r.data.propertyBreakdown||[]);
        setRecentV(r.data.recentVisitors||[]);
        setRecentG(r.data.recentGatePasses||[]);
        setExpLeases(r.data.expiringLeasesList||[]);
      }
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  // ── Role-based routing ──────────────────────────────────────────────────────
  if(!loading && user?.role) {
    if(user.role==="Floor Admin")
      return <Suspense fallback={SPINNER}><FloorAdminDash user={user} /></Suspense>;
    if(user.role==="Office Owner" || user.role==="Owner")
      return <Suspense fallback={SPINNER}><OfficeOwnerDash user={user} /></Suspense>;
    if(user.role==="Staff Admin")
      return <Suspense fallback={SPINNER}><StaffAdminDash user={user} /></Suspense>;
    if(user.role==="Watchman" || user.role==="Security")
      return <Suspense fallback={SPINNER}><WatchmanDash user={user} /></Suspense>;
  }

  const isSA = user?.role==="Super Admin"||user?.role==="Admin"||user?.role==="Staff Admin";
  const th: React.CSSProperties = { background:"#1e293b",color:"#fff",fontSize:"0.68rem",fontWeight:700,padding:"10px 12px",textTransform:"uppercase",letterSpacing:"0.05em",border:"none",whiteSpace:"nowrap" };
  const td: React.CSSProperties = { padding:"9px 12px",fontSize:"0.82rem",color:"#1e293b",borderBottom:"1px solid #f1f5f9" };

  if(loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:16 }}>

      <div className="spinner-border" style={{ color:"#014aad",width:36,height:36 }} role="status" />
      <span style={{ color:"#64748b",fontSize:"0.9rem",fontWeight:600 }}>Loading dashboard...</span>
    </div>
  );

  return (
    <div style={{ padding:"0 0 40px" }}>
      <style>{`
        .dash-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .dash-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .dash-grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
        .panel { background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.05); }
        .panel-head { background:#1e293b; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; }
        .panel-title { color:#fff; font-size:0.8rem; font-weight:700; margin:0; letter-spacing:0.02em; }
        .panel-body { padding:16px; }
        .qa-btn { display:flex; flex-direction:column; align-items:center; gap:6px; padding:14px 10px; border:1.5px solid #e2e8f0; border-radius:10px; background:#fff; cursor:pointer; text-decoration:none; transition:all 0.15s; color:#1e293b; }
        .qa-btn:hover { background:#014aad; border-color:#014aad; color:#fff; transform:translateY(-2px); box-shadow:0 6px 16px #014aad30; }
        .qa-btn:hover .qa-icon { background:rgba(255,255,255,0.2); color:#fff; }
        .qa-icon { width:38px; height:38px; border-radius:9px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
        @media(max-width:900px){.dash-grid-4{grid-template-columns:repeat(2,1fr)}.dash-grid-3{grid-template-columns:1fr}.dash-grid-2{grid-template-columns:1fr}}
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:"linear-gradient(135deg,#1e293b 0%,#0f172a 100%)", borderRadius:16, padding:"24px 28px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.1em",color:"#60a5fa",textTransform:"uppercase",marginBottom:4 }}>Property Admin Dashboard</div>
          <h2 style={{ color:"#fff",fontWeight:800,fontSize:"1.6rem",margin:0 }}>System Overview</h2>
          <p style={{ color:"#94a3b8",fontSize:"0.8rem",margin:"4px 0 0" }}>Real-time analytics · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
        </div>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:"#fff",fontWeight:700,fontSize:"0.9rem" }}>{user?.name||"Admin"}</div>
            <div style={{ color:"#60a5fa",fontSize:"0.72rem",fontWeight:600 }}>{user?.role||"—"}</div>
          </div>
          <div style={{ width:42,height:42,borderRadius:"50%",background:"#014aad",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <i className="bi bi-person-fill" style={{ color:"#fff",fontSize:"1.2rem" }} />
          </div>
        </div>
      </div>

      {/* ── Stat Cards Row 1 ── */}
      <div className="dash-grid-4" style={{ marginBottom:14 }}>
        {isSA && <StatCard label="Total Properties" value={m.totalProperties??0} icon="bi-building" color={COLOR.blue} sub="All properties" />}
        <StatCard label="Total Floors"      value={m.totalFloors??0}         icon="bi-layers"           color={COLOR.purple} sub="Across all properties" />
        <StatCard label="Total Units"       value={m.totalUnits??0}          icon="bi-grid-3x3-gap"     color={COLOR.teal}   sub={`${m.occupiedUnits??0} occupied`} />
        <StatCard label="Occupancy"         value={`${m.occupancyPct??0}%`} icon="bi-pie-chart-fill"   color={COLOR.green}  sub={`${(m.occupiedSft||0).toLocaleString()} sqft used`} />
      </div>

      {/* ── Stat Cards Row 2 ── */}
      <div className="dash-grid-4" style={{ marginBottom:14 }}>
        <StatCard label="Monthly Revenue"   value={`₹${((m.totalRevenue||0)/100000).toFixed(1)}L`} icon="bi-cash-stack"        color={COLOR.green}  sub="Rent + CAM" />
        <StatCard label="Active Tenants"    value={m.activeTenantsCount??0}  icon="bi-people-fill"      color={COLOR.blue}   sub="Active leases" />
        <StatCard label="Pending Approvals" value={m.pendingApprovals??0}    icon="bi-hourglass-split"  color={COLOR.yellow} sub="Visitors + Gate passes" />
        <StatCard label="Visitors Today"    value={m.visitorsToday??0}       icon="bi-person-badge"     color={COLOR.teal}   sub={`${m.visitorsCheckedIn??0} currently inside`} />
      </div>

      {/* ── Stat Cards Row 3 ── */}
      <div className="dash-grid-4" style={{ marginBottom:24 }}>
        <StatCard label="Gate Passes"       value={m.gatePassTotal??0}      icon="bi-card-checklist"   color={COLOR.slate}  sub={`${m.gatePassPending??0} pending`} />
        <StatCard label="Expiring Leases"   value={m.expiringLeasesCount??0} icon="bi-exclamation-triangle" color={COLOR.red} sub="Within 60 days" />
        <StatCard label="Available SFT"     value={(m.availableSft||0).toLocaleString()} icon="bi-circle" color={COLOR.orange} sub="Vacant area" />
        <StatCard label="Total Staff"       value={m.totalStaff??0}         icon="bi-person-workspace" color={COLOR.purple} sub="Floor & security staff" />
      </div>

      {/* ── Quick Actions ── */}
      <div className="panel" style={{ marginBottom:24 }}>
        <div className="panel-head">
          <h6 className="panel-title"><i className="bi bi-lightning-fill me-2" style={{ color:"#fbbf24" }} />Quick Actions</h6>
        </div>
        <div className="panel-body">
          <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:10 }}>
            {[
              { label:"Add Property", icon:"bi-building-add",    href:"/admin/properties" },
              { label:"Add Floor",    icon:"bi-layers",           href:"/admin/floors" },
              { label:"Add Visitor",  icon:"bi-person-plus-fill", href:"/admin/visitors" },
              { label:"Gate Pass",   icon:"bi-card-checklist",   href:"/admin/materials" },
              { label:"Add Lease",   icon:"bi-file-earmark-text",href:"/admin/leases" },
              { label:"Add Asset",   icon:"bi-tools",            href:"/admin/assets" },
              { label:"Add Staff",   icon:"bi-person-badge",     href:"/admin/users" },
            ].map(a=>(
              <Link key={a.label} href={a.href} className="qa-btn">
                <div className="qa-icon"><i className={`bi ${a.icon}`} style={{ fontSize:"1.1rem",color:"#014aad" }} /></div>
                <span style={{ fontSize:"0.68rem",fontWeight:700,textAlign:"center",lineHeight:1.3 }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="dash-grid-3" style={{ marginBottom:24 }}>

        {/* Revenue Bar Chart */}
        <div className="panel">
          <div className="panel-head">
            <h6 className="panel-title"><i className="bi bi-bar-chart-fill me-2" style={{ color:"#34d399" }} />Revenue Trend</h6>
            <span style={{ fontSize:"0.65rem",color:"#94a3b8" }}>Last 6 months</span>
          </div>
          <div className="panel-body">
            {rev.length > 0 ? <RevenueBar items={rev} /> : <p style={{ color:"#94a3b8",fontSize:"0.8rem",textAlign:"center",margin:"30px 0" }}>No revenue data</p>}
            <div style={{ display:"flex",gap:16,marginTop:12 }}>
              <div><div style={{ fontSize:"0.65rem",color:"#94a3b8" }}>Rent</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:"#1e293b" }}>₹{((m.leaseRevenue||0)/1000).toFixed(0)}K</div></div>
              <div><div style={{ fontSize:"0.65rem",color:"#94a3b8" }}>CAM</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:"#1e293b" }}>₹{((m.camRevenue||0)/1000).toFixed(0)}K</div></div>
            </div>
          </div>
        </div>

        {/* Visitor Line Chart */}
        <div className="panel">
          <div className="panel-head">
            <h6 className="panel-title"><i className="bi bi-graph-up-arrow me-2" style={{ color:"#60a5fa" }} />Visitor Analytics</h6>
            <span style={{ fontSize:"0.65rem",color:"#94a3b8" }}>Last 7 days</span>
          </div>
          <div className="panel-body">
            {vis.length>0 ? <VisitorLine items={vis} /> : <p style={{ color:"#94a3b8",fontSize:"0.8rem",textAlign:"center",margin:"30px 0" }}>No visitor data</p>}
            <div style={{ display:"flex",gap:16,marginTop:12 }}>
              <div><div style={{ fontSize:"0.65rem",color:"#94a3b8" }}>Today</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:"#1e293b" }}>{m.visitorsToday??0}</div></div>
              <div><div style={{ fontSize:"0.65rem",color:"#94a3b8" }}>Pending</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:"#d97706" }}>{m.visitorsPending??0}</div></div>
              <div><div style={{ fontSize:"0.65rem",color:"#94a3b8" }}>Inside</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:"#016a34" }}>{m.visitorsCheckedIn??0}</div></div>
            </div>
          </div>
        </div>

        {/* Occupancy Panel */}
        <div className="panel">
          <div className="panel-head">
            <h6 className="panel-title"><i className="bi bi-building me-2" style={{ color:"#c084fc" }} />Occupancy Overview</h6>
          </div>
          <div className="panel-body">
            <div style={{ textAlign:"center",marginBottom:16 }}>
              <div style={{ fontSize:"2.4rem",fontWeight:800,color:COLOR.blue }}>{m.occupancyPct??0}<span style={{ fontSize:"1.2rem" }}>%</span></div>
              <div style={{ fontSize:"0.72rem",color:"#94a3b8",fontWeight:600 }}>Overall Occupancy Rate</div>
            </div>
            <MiniBar label="Occupied SFT" val={m.occupiedSft||0} max={m.totalSft||1} color={COLOR.blue} />
            <MiniBar label="Available SFT" val={m.availableSft||0} max={m.totalSft||1} color={COLOR.orange} />
            {props.slice(0,3).map((p:any,i:number)=>(
              <MiniBar key={i} label={p.name} val={p.occupiedSft} max={p.totalSft||1} color={i===0?COLOR.green:i===1?COLOR.purple:COLOR.teal} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Gate Pass & Lease Row ── */}
      <div className="dash-grid-2" style={{ marginBottom:24 }}>

        {/* Gate Pass Stats */}
        <div className="panel">
          <div className="panel-head">
            <h6 className="panel-title"><i className="bi bi-card-checklist me-2" style={{ color:"#fb923c" }} />Gate Pass Summary</h6>
            <Link href="/admin/materials" style={{ fontSize:"0.7rem",color:"#60a5fa",textDecoration:"none",fontWeight:700 }}>View All →</Link>
          </div>
          <div className="panel-body">
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16 }}>
              {[
                { label:"Total",   value:m.gatePassTotal??0,   color:COLOR.slate  },
                { label:"Pending", value:m.gatePassPending??0, color:COLOR.yellow },
                { label:"Approved",value:m.gatePassApproved??0,color:COLOR.green  },
              ].map((s,i)=>(
                <div key={i} style={{ background:"#f8fafc",borderRadius:10,padding:"12px",textAlign:"center",border:"1px solid #e2e8f0" }}>
                  <div style={{ fontSize:"1.4rem",fontWeight:800,color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:"0.62rem",color:"#94a3b8",fontWeight:700,textTransform:"uppercase" }}>{s.label}</div>
                </div>
              ))}
            </div>
            {recentG.length>0 ? (
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead><tr>
                  <th style={th}>Material</th><th style={th}>Type</th><th style={th}>Status</th>
                </tr></thead>
                <tbody>
                  {recentG.slice(0,4).map((g:any,i:number)=>{
                    const sp = STATUS_PILL[g.status]||STATUS_PILL.Pending;
                    return (
                      <tr key={i}>
                        <td style={td}>{g.material?.substring(0,22)||"—"}{(g.material?.length>22)?"…":""}</td>
                        <td style={td}><span style={{ fontSize:"0.7rem",padding:"2px 8px",borderRadius:20,background:g.type==="Inward"?"#dcfce7":"#dbeafe",color:g.type==="Inward"?"#166534":"#1e40af",fontWeight:700 }}>{g.type}</span></td>
                        <td style={td}><span style={{ fontSize:"0.7rem",padding:"2px 8px",borderRadius:20,background:sp.bg,color:sp.cl,fontWeight:700 }}>{g.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ):<p style={{ color:"#94a3b8",fontSize:"0.8rem",textAlign:"center",margin:"20px 0" }}>No gate passes yet</p>}
          </div>
        </div>

        {/* Expiring Leases */}
        <div className="panel">
          <div className="panel-head">
            <h6 className="panel-title"><i className="bi bi-exclamation-triangle-fill me-2" style={{ color:"#fbbf24" }} />Leases Expiring Soon</h6>
            <Link href="/admin/leases" style={{ fontSize:"0.7rem",color:"#60a5fa",textDecoration:"none",fontWeight:700 }}>View All →</Link>
          </div>
          <div className="panel-body">
            {expLeases.length>0 ? (
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead><tr>
                  <th style={th}>Tenant</th><th style={th}>Property</th><th style={th}>Expires</th>
                </tr></thead>
                <tbody>
                  {expLeases.map((l:any,i:number)=>{
                    const daysLeft = Math.ceil((new Date(l.endDate).getTime()-Date.now())/(86400000));
                    return (
                      <tr key={i}>
                        <td style={td}><span style={{ fontWeight:700 }}>{l.tenantName}</span></td>
                        <td style={td}>{l.property}</td>
                        <td style={td}>
                          <span style={{ fontSize:"0.7rem",padding:"2px 8px",borderRadius:20,fontWeight:700,
                            background:daysLeft<=10?"#fee2e2":daysLeft<=30?"#fef9c3":"#f1f5f9",
                            color:daysLeft<=10?"#991b1b":daysLeft<=30?"#854d0e":"#475569" }}>
                            {daysLeft}d left
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ):<div style={{ textAlign:"center",padding:"24px 0",color:"#94a3b8" }}>
              <i className="bi bi-check2-circle" style={{ fontSize:"2rem",display:"block",marginBottom:8,color:"#16a34a" }} />
              <span style={{ fontSize:"0.8rem" }}>No leases expiring within 60 days</span>
            </div>}
          </div>
        </div>
      </div>

      {/* ── Recent Visitors ── */}
      <div className="panel">
        <div className="panel-head">
          <h6 className="panel-title"><i className="bi bi-person-badge me-2" style={{ color:"#38bdf8" }} />Recent Visitors</h6>
          <Link href="/admin/visitors" style={{ fontSize:"0.7rem",color:"#60a5fa",textDecoration:"none",fontWeight:700 }}>View All →</Link>
        </div>
        <div className="panel-body" style={{ padding:0 }}>
          {recentV.length>0 ? (
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead><tr>
                <th style={th}>Visitor</th><th style={th}>Contact</th><th style={th}>Property</th>
                <th style={th}>Date</th><th style={th}>Registered By</th><th style={th}>Status</th>
              </tr></thead>
              <tbody>
                {recentV.map((v:any,i:number)=>{
                  const sp = STATUS_PILL[v.status]||STATUS_PILL.Pending;
                  return (
                    <tr key={i} style={{ background:i%2===0?"#fff":"#f8fafc" }}>
                      <td style={td}><span style={{ fontWeight:700 }}>{v.name}</span></td>
                      <td style={{ ...td,fontFamily:"monospace",color:"#64748b" }}>{v.contact}</td>
                      <td style={td}>{v.property}</td>
                      <td style={td}>{v.date}</td>
                      <td style={td}><span style={{ fontSize:"0.75rem",color:"#64748b" }}>{v.createdBy}</span></td>
                      <td style={td}><span style={{ fontSize:"0.7rem",padding:"2px 8px",borderRadius:20,fontWeight:700,background:sp.bg,color:sp.cl }}>{v.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ):<p style={{ color:"#94a3b8",fontSize:"0.8rem",textAlign:"center",margin:"24px 0" }}>No visitors registered yet</p>}
        </div>
      </div>
    </div>
  );
}
