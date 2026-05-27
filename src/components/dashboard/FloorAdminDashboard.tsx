"use client";
import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { StatCard, Panel, BarChart, LineChart, DonutGauge, ProgressBar, QuickActions, StatusPill, DashHeader, AlertItem, DASH_STYLES } from "@/components/dashboard/DashWidgets";

export default function FloorAdminDashboard({ user }: { user: any }) {
  const [m, setM]     = useState<any>({});
  const [rev, setRev] = useState<any[]>([]);
  const [vis, setVis] = useState<any[]>([]);
  const [floors, setFloors]     = useState<any[]>([]);
  const [recentV, setRecentV]   = useState<any[]>([]);
  const [recentG, setRecentG]   = useState<any[]>([]);
  const [expLeases, setExpLeases]= useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(()=>{
    api.get("/dashboard/metrics").then(r=>{
      if(r.success){
        setM(r.data.metrics||{});
        setRev(r.data.monthlyRevenue||[]);
        setVis(r.data.visitorTrend||[]);
        setFloors(r.data.propertyBreakdown||[]);
        setRecentV(r.data.recentVisitors||[]);
        setRecentG(r.data.recentGatePasses||[]);
        setExpLeases(r.data.expiringLeasesList||[]);
      }
    }).finally(()=>setLoading(false));
  },[]);

  if(loading) return <div className="d-flex align-items-center justify-content-center" style={{ height:"50vh" }}><div className="spinner-border" style={{ color:"#014aad" }} /></div>;

  const C = { blue:"#014aad",green:"#16a34a",yellow:"#d97706",red:"#dc2626",purple:"#7c3aed",teal:"#0891b2" };

  return (
    <div style={{ paddingBottom:40 }}>
      <style>{DASH_STYLES}</style>

      <DashHeader
        title="Floor Admin Dashboard"
        subtitle={`Managing ${m.totalFloors??0} floor(s) · ${new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}`}
        user={user} accentColor="#60a5fa"
      />

      {/* Stats Row 1 */}
      <div className="d-g4 d-mb">
        <StatCard label="Assigned Floors"   value={m.totalFloors??0}          icon="bi-layers"          color={C.blue}   sub="Under management" />
        <StatCard label="Total Offices"     value={m.totalUnits??0}           icon="bi-grid-3x3-gap"    color={C.purple} sub={`${m.occupiedUnits??0} occupied`} />
        <StatCard label="Active Tenants"    value={m.activeTenantsCount??0}   icon="bi-people-fill"     color={C.green}  sub="Active leases" />
        <StatCard label="Monthly Revenue"   value={`₹${((m.totalRevenue||0)/1000).toFixed(0)}K`} icon="bi-cash-stack" color={C.teal} sub="Rent + CAM" />
      </div>

      {/* Stats Row 2 */}
      <div className="d-g4 d-mb">
        <StatCard label="Occupied SFT"      value={(m.occupiedSft||0).toLocaleString()}  icon="bi-check-circle"      color={C.blue}   sub={`${m.occupancyPct??0}% occupancy`} />
        <StatCard label="Available SFT"     value={(m.availableSft||0).toLocaleString()} icon="bi-circle"            color={C.yellow} sub="Vacant area" />
        <StatCard label="Visitors Today"    value={m.visitorsToday??0}        icon="bi-person-badge"    color={C.teal}   sub={`${m.visitorsCheckedIn??0} inside`} />
        <StatCard label="Pending Approvals" value={m.pendingApprovals??0}     icon="bi-hourglass-split" color={C.red}    sub="Needs your action" />
      </div>

      {/* Quick Actions */}
      <div className="d-mb">
        <Panel title="Quick Actions" icon="bi-lightning-fill" iconColor="#fbbf24" accent="#1e293b">
          <QuickActions actions={[
            { label:"Register Visitor",  icon:"bi-person-plus-fill", href:"/admin/visitors" },
            { label:"Create Gate Pass",  icon:"bi-card-checklist",   href:"/admin/materials" },
            { label:"Add Office/Unit",   icon:"bi-door-open",        href:"/admin/offices" },
            { label:"Manage Leases",     icon:"bi-file-earmark-text",href:"/admin/leases" },
            { label:"Approve Requests",  icon:"bi-check2-circle",    href:"/admin/visitors" },
            { label:"Add Staff",         icon:"bi-person-badge",     href:"/admin/users" },
          ]} />
        </Panel>
      </div>

      {/* Charts Row */}
      <div className="d-g3 d-mb">
        {/* Revenue */}
        <Panel title="Revenue Trend" icon="bi-bar-chart-fill" iconColor="#34d399" accent="#1e293b">
          {rev.length>0
            ? <><BarChart items={rev.map(r=>({label:r.label,value:r.revenue}))} color={C.blue} />
                <div style={{ display:"flex",gap:16,marginTop:12 }}>
                  <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Rent</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:"#1e293b" }}>₹{((m.leaseRevenue||0)/1000).toFixed(0)}K</div></div>
                  <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>CAM</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:"#1e293b" }}>₹{((m.camRevenue||0)/1000).toFixed(0)}K</div></div>
                </div></>
            : <p style={{ textAlign:"center",color:"#94a3b8",margin:"30px 0",fontSize:"0.8rem" }}>No revenue data</p>}
        </Panel>

        {/* Visitor Trend */}
        <Panel title="Visitor Analytics" icon="bi-graph-up-arrow" iconColor="#60a5fa" accent="#1e293b">
          {vis.length>0
            ? <LineChart items={vis.map(v=>({label:v.label,value:v.count}))} color={C.blue} />
            : <p style={{ textAlign:"center",color:"#94a3b8",margin:"30px 0",fontSize:"0.8rem" }}>No visitor data</p>}
          <div style={{ display:"flex",gap:16,marginTop:12 }}>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Today</div><div style={{ fontSize:"0.9rem",fontWeight:800 }}>{m.visitorsToday??0}</div></div>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Pending</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:C.yellow }}>{m.visitorsPending??0}</div></div>
          </div>
        </Panel>

        {/* Occupancy Gauge */}
        <Panel title="Floor Occupancy" icon="bi-building" iconColor="#c084fc" accent="#1e293b">
          <div style={{ display:"flex",justifyContent:"center",marginBottom:12 }}>
            <DonutGauge pct={m.occupancyPct??0} color={C.blue} label="Overall Occupancy" />
          </div>
          {floors.slice(0,4).map((f:any,i:number)=>(
            <ProgressBar key={i} label={f.name} val={f.occupiedSft} max={f.totalSft||1}
              color={[C.blue,C.green,C.purple,C.teal][i%4]} />
          ))}
        </Panel>
      </div>

      {/* Bottom Row */}
      <div className="d-g2">
        {/* Recent Visitors */}
        <Panel title="Recent Visitors" icon="bi-person-badge" iconColor="#38bdf8" link="/admin/visitors" accent="#1e293b">
          {recentV.length>0 ? recentV.slice(0,5).map((v:any,i:number)=>(
            <AlertItem key={i} icon="bi-person-check" iconColor={C.blue}
              title={v.name} sub={`${v.property} · ${v.date}`} time={<StatusPill status={v.status} />} />
          )) : <p style={{ textAlign:"center",color:"#94a3b8",fontSize:"0.8rem",margin:"20px 0" }}>No recent visitors</p>}
        </Panel>

        {/* Expiring Leases */}
        <Panel title="Lease Expiry Alerts" icon="bi-exclamation-triangle-fill" iconColor="#fbbf24" link="/admin/leases" accent="#1e293b">
          {expLeases.length>0 ? expLeases.slice(0,5).map((l:any,i:number)=>{
            const days=Math.ceil((new Date(l.endDate).getTime()-Date.now())/86400000);
            return <AlertItem key={i} icon="bi-calendar-x" iconColor={days<=10?C.red:C.yellow}
              title={l.tenantName} sub={l.property}
              time={<span style={{ fontSize:"0.68rem",fontWeight:700,color:days<=10?C.red:C.yellow }}>{days}d left</span>} />;
          }) : <div style={{ textAlign:"center",padding:"20px 0",color:"#94a3b8" }}>
            <i className="bi bi-check2-circle" style={{ fontSize:"1.8rem",color:C.green,display:"block",marginBottom:6 }} />
            <span style={{ fontSize:"0.8rem" }}>No leases expiring soon</span>
          </div>}
        </Panel>
      </div>
    </div>
  );
}
