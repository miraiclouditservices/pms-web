"use client";
import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { StatCard, Panel, BarChart, LineChart, QuickActions, StatusPill, DashHeader, AlertItem, DASH_STYLES } from "@/components/dashboard/DashWidgets";

export default function StaffAdminDashboard({ user }: { user: any }) {
  const [m, setM]   = useState<any>({});
  const [vis, setVis]= useState<any[]>([]);
  const [recentV, setRecentV] = useState<any[]>([]);
  const [recentG, setRecentG] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get("/dashboard/metrics").then(r=>{
      if(r.success){
        setM(r.data.metrics||{});
        setVis(r.data.visitorTrend||[]);
        setRecentV(r.data.recentVisitors||[]);
        setRecentG(r.data.recentGatePasses||[]);
      }
    }).finally(()=>setLoading(false));
  },[]);

  if(loading) return <div className="d-flex align-items-center justify-content-center" style={{ height:"50vh" }}><div className="spinner-border" style={{ color:"#0891b2" }} /></div>;

  const C = { teal:"#0891b2",blue:"#014aad",green:"#16a34a",yellow:"#d97706",red:"#dc2626",slate:"#475569" };
  const today = new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});

  return (
    <div style={{ paddingBottom:40 }}>
      <style>{DASH_STYLES}</style>

      <DashHeader
        title="Staff Admin Dashboard"
        subtitle={`Daily operations control · ${today}`}
        user={user} accentColor="#38bdf8" gradientFrom="#0c4a6e" gradientTo="#082f49"
      />

      {/* Stats */}
      <div className="d-g4 d-mb">
        <StatCard label="Total Staff"       value={m.totalStaff??0}          icon="bi-people-fill"     color={C.teal}   sub="All roles" />
        <StatCard label="Visitors Today"    value={m.visitorsToday??0}       icon="bi-person-badge"    color={C.blue}   sub={`${m.visitorsCheckedIn??0} inside`} />
        <StatCard label="Pending Approvals" value={m.pendingApprovals??0}    icon="bi-hourglass-split" color={C.yellow} sub="Visitor + gate pass" />
        <StatCard label="Active Gate Passes"value={m.gatePassApproved??0}   icon="bi-card-checklist"  color={C.green}  sub="Approved passes" />
      </div>
      <div className="d-g4 d-mb">
        <StatCard label="Pending Visitors"  value={m.visitorsPending??0}     icon="bi-person-x"        color={C.red}    sub="Awaiting approval" />
        <StatCard label="Gate Pass Pending" value={m.gatePassPending??0}     icon="bi-clock-fill"      color={C.yellow} sub="Awaiting review" />
        <StatCard label="Checked In"        value={m.visitorsCheckedIn??0}  icon="bi-door-open-fill"  color={C.teal}   sub="Currently inside" />
        <StatCard label="Total Gate Passes" value={m.gatePassTotal??0}      icon="bi-clipboard2-check" color={C.slate} sub="All time" />
      </div>

      {/* Quick Actions */}
      <div className="d-mb">
        <Panel title="Quick Actions" icon="bi-lightning-fill" iconColor="#fbbf24" accent="#0c4a6e">
          <QuickActions actions={[
            { label:"Manage Visitors",  icon:"bi-person-badge",      href:"/admin/visitors",  color:C.teal },
            { label:"Gate Passes",      icon:"bi-card-checklist",    href:"/admin/materials", color:C.blue },
            { label:"Support Ticket",   icon:"bi-headset",           href:"/admin/helpdesk",  color:C.green },
            { label:"View Reports",     icon:"bi-file-bar-graph",    href:"/admin/reports",   color:C.yellow },
          ]} />
        </Panel>
      </div>

      {/* Charts */}
      <div className="d-g2 d-mb">
        <Panel title="Daily Visitor Trend" icon="bi-graph-up-arrow" iconColor="#38bdf8" accent="#0c4a6e">
          {vis.length>0
            ? <LineChart items={vis.map(v=>({label:v.label,value:v.count}))} color={C.teal} />
            : <p style={{ textAlign:"center",color:"#94a3b8",margin:"30px 0",fontSize:"0.8rem" }}>No visitor data</p>}
          <div style={{ display:"flex",gap:14,marginTop:12 }}>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Today</div><div style={{ fontSize:"0.9rem",fontWeight:800 }}>{m.visitorsToday??0}</div></div>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Inside</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:C.green }}>{m.visitorsCheckedIn??0}</div></div>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Pending</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:C.yellow }}>{m.visitorsPending??0}</div></div>
          </div>
        </Panel>

        <Panel title="Gate Pass Analytics" icon="bi-bar-chart-fill" iconColor="#34d399" accent="#0c4a6e">
          <BarChart items={[
            { label:"Total",   value:m.gatePassTotal??0 },
            { label:"Approved",value:m.gatePassApproved??0 },
            { label:"Pending", value:m.gatePassPending??0 },
          ]} color={C.teal} />
          <div style={{ display:"flex",gap:14,marginTop:12 }}>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Total</div><div style={{ fontSize:"0.9rem",fontWeight:800 }}>{m.gatePassTotal??0}</div></div>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Approved</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:C.green }}>{m.gatePassApproved??0}</div></div>
          </div>
        </Panel>
      </div>

      {/* Recent Activity */}
      <div className="d-g2">
        <Panel title="Recent Visitors" icon="bi-person-badge" iconColor="#38bdf8" link="/admin/visitors" accent="#0c4a6e">
          {recentV.length>0
            ? recentV.slice(0,5).map((v:any,i:number)=>(
              <AlertItem key={i} icon="bi-person-check" iconColor={C.teal}
                title={v.name} sub={`${v.property} · ${v.date}`} time={<StatusPill status={v.status} />} />
            ))
            : <p style={{ textAlign:"center",color:"#94a3b8",fontSize:"0.8rem",margin:"20px 0" }}>No visitors</p>}
        </Panel>
        <Panel title="Recent Gate Passes" icon="bi-card-checklist" iconColor="#34d399" link="/admin/materials" accent="#0c4a6e">
          {recentG.length>0
            ? recentG.slice(0,5).map((g:any,i:number)=>(
              <AlertItem key={i} icon="bi-box-seam" iconColor={C.blue}
                title={g.material||"—"} sub={`${g.property} · ${g.type}`} time={<StatusPill status={g.status} />} />
            ))
            : <p style={{ textAlign:"center",color:"#94a3b8",fontSize:"0.8rem",margin:"20px 0" }}>No gate passes</p>}
        </Panel>
      </div>
    </div>
  );
}
