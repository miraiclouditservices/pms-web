"use client";
import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { StatCard, Panel, LineChart, BarChart, DonutGauge, QuickActions, StatusPill, DashHeader, AlertItem, DASH_STYLES } from "@/components/dashboard/DashWidgets";

export default function WatchmanDashboard({ user }: { user: any }) {
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

  if(loading) return <div className="d-flex align-items-center justify-content-center" style={{ height:"50vh" }}><div className="spinner-border" style={{ color:"#16a34a" }} /></div>;

  const C = { green:"#16a34a",blue:"#014aad",yellow:"#d97706",red:"#dc2626",teal:"#0891b2",slate:"#475569" };

  return (
    <div style={{ paddingBottom:40 }}>
      <style>{DASH_STYLES}</style>

      <DashHeader
        title="Security Gate Dashboard"
        subtitle={`Live gate monitoring · ${new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}`}
        user={user} accentColor="#4ade80" gradientFrom="#14532d" gradientTo="#052e16"
      />

      {/* Live Gate Status */}
      <div className="d-g4 d-mb">
        <StatCard label="Visitors Today"   value={m.visitorsToday??0}      icon="bi-person-badge"     color={C.green}  sub="Registered today" />
        <StatCard label="Currently Inside" value={m.visitorsCheckedIn??0} icon="bi-door-open-fill"   color={C.blue}   sub="Checked in" />
        <StatCard label="Pending Entry"    value={m.visitorsPending??0}   icon="bi-hourglass-split"  color={C.yellow} sub="Waiting approval" />
        <StatCard label="Gate Passes"      value={m.gatePassApproved??0} icon="bi-card-checklist"   color={C.teal}   sub="Active passes" />
      </div>

      {/* Live Status Indicator */}
      <div className="d-mb">
        <div style={{ background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:14,height:14,borderRadius:"50%",background:C.green,boxShadow:`0 0 0 4px ${C.green}30`,animation:"pulse 2s infinite" }} />
            <div>
              <div style={{ fontSize:"0.68rem",fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em" }}>Gate Status</div>
              <div style={{ fontSize:"1rem",fontWeight:800,color:"#1e293b" }}>Security Active — Monitoring</div>
            </div>
          </div>
          <div style={{ display:"flex",gap:20 }}>
            {[
              { l:"Inside Now", v:m.visitorsCheckedIn??0, c:C.green },
              { l:"Pending", v:m.visitorsPending??0, c:C.yellow },
              { l:"Gate Passes", v:m.gatePassApproved??0, c:C.blue },
            ].map((s,i)=>(
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"1.4rem",fontWeight:800,color:s.c }}>{s.v}</div>
                <div style={{ fontSize:"0.62rem",color:"#94a3b8",fontWeight:700 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 4px #16a34a30}50%{box-shadow:0 0 0 8px #16a34a20}}`}</style>
      </div>

      {/* Quick Actions */}
      <div className="d-mb">
        <Panel title="Quick Actions" icon="bi-lightning-fill" iconColor="#fbbf24" accent="#14532d">
          <QuickActions actions={[
            { label:"View Visitors",   icon:"bi-person-badge",    href:"/admin/visitors",  color:C.green },
            { label:"Gate Passes",     icon:"bi-card-checklist",  href:"/admin/materials", color:C.blue },
            { label:"Check In",        icon:"bi-door-open-fill",  href:"/admin/visitors",  color:C.teal },
            { label:"Check Out",       icon:"bi-box-arrow-right", href:"/admin/visitors",  color:C.yellow },
          ]} />
        </Panel>
      </div>

      {/* Charts */}
      <div className="d-g2 d-mb">
        <Panel title="Visitor Traffic — Last 7 Days" icon="bi-graph-up-arrow" iconColor="#4ade80" accent="#14532d">
          {vis.length>0
            ? <LineChart items={vis.map(v=>({label:v.label,value:v.count}))} color={C.green} />
            : <p style={{ textAlign:"center",color:"#94a3b8",margin:"30px 0",fontSize:"0.8rem" }}>No data yet</p>}
          <div style={{ display:"flex",gap:14,marginTop:12 }}>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Today</div><div style={{ fontSize:"0.9rem",fontWeight:800 }}>{m.visitorsToday??0}</div></div>
            <div><div style={{ fontSize:"0.62rem",color:"#94a3b8" }}>Inside</div><div style={{ fontSize:"0.9rem",fontWeight:800,color:C.green }}>{m.visitorsCheckedIn??0}</div></div>
          </div>
        </Panel>

        <Panel title="Entry Overview" icon="bi-pie-chart-fill" iconColor="#4ade80" accent="#14532d">
          <div style={{ display:"flex",justifyContent:"center",marginBottom:16 }}>
            <DonutGauge
              pct={m.visitorsToday>0 ? Math.round(((m.visitorsCheckedIn||0)/m.visitorsToday)*100) : 0}
              color={C.green} label="Check-in Rate" />
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
            {[
              { l:"Approved", v:m.visitorsToday??0, c:C.green },
              { l:"Pending",  v:m.visitorsPending??0, c:C.yellow },
              { l:"Inside",   v:m.visitorsCheckedIn??0, c:C.blue },
            ].map((s,i)=>(
              <div key={i} style={{ background:"#f8fafc",borderRadius:10,padding:"10px 8px",textAlign:"center",border:"1px solid #e2e8f0" }}>
                <div style={{ fontSize:"1.2rem",fontWeight:800,color:s.c }}>{s.v}</div>
                <div style={{ fontSize:"0.6rem",color:"#94a3b8",fontWeight:700,textTransform:"uppercase" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Live Visitor List */}
      <Panel title="Today's Visitor Log" icon="bi-person-check-fill" iconColor="#4ade80" link="/admin/visitors" accent="#14532d">
        {recentV.length>0
          ? recentV.slice(0,6).map((v:any,i:number)=>(
            <AlertItem key={i}
              icon={v.status==="Checked-In"?"bi-door-open-fill":v.status==="Approved"?"bi-check-circle-fill":"bi-hourglass-split"}
              iconColor={v.status==="Checked-In"?C.blue:v.status==="Approved"?C.green:C.yellow}
              title={v.name} sub={`${v.contact} · ${v.property}`} time={<StatusPill status={v.status} />} />
          ))
          : <div style={{ textAlign:"center",padding:"24px 0",color:"#94a3b8" }}>
            <i className="bi bi-inbox" style={{ fontSize:"1.8rem",display:"block",marginBottom:8 }} />
            <span style={{ fontSize:"0.8rem" }}>No visitors today</span>
          </div>}
      </Panel>
    </div>
  );
}
